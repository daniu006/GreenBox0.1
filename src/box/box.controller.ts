import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from 'src/shared/decorators/current-user.decorator';
import { BoxService } from './box.service';
import { UserPlantService } from 'src/user-plant/user-plant.service';
import { SensorsService } from 'src/sensors/sensors.service';
import { WebSocketGateway } from 'src/websocket/websocket.gateway';
import {
  ValidateCodeDto,
  UpdateLocationDto,
  RegisterFcmTokenDto,
  RemoveFcmTokenDto,
} from './box.dto';

@Controller('box')
@UseGuards(FirebaseAuthGuard)
export class BoxController {
  constructor(
    private readonly boxService: BoxService,
    private readonly userPlantService: UserPlantService,
    private readonly sensorsService: SensorsService,
    private readonly websocketGateway: WebSocketGateway,
  ) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateCode(
    @Body() dto: ValidateCodeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.boxService.validateCode(
      dto.code,
      user.uid,
      user.email,
    );
    return {
      message: 'Dispositivo validado exitosamente',
      data: {
        box: {
          id: result.box.id,
          code: result.box.code,
          locationName: result.box.locationName,
          profileImage: result.box.profileImage || null,
          hasLocation: this.boxService.hasLocation(result.box),
        },
        userPlantId: result.userPlantId,
        plant: result.plant,
      },
    };
  }

  @Get()
  async getMyBoxes(@CurrentUser() user: CurrentUserPayload) {
    const boxes = await this.boxService.getByUser(user.uid);
    return {
      message: 'Dispositivos obtenidos exitosamente',
      data: boxes.map((b) => ({
        id: b.id,
        code: b.code,
        locationName: b.locationName,
        latitude: b.latitude,
        longitude: b.longitude,
        profileImage: b.profileImage || null,
        hasLocation: this.boxService.hasLocation(b),
      })),
    };
  }

  @Get(':id')
  async getBoxInfo(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.boxService.getBoxInfo(id, user.uid);
  }

  @Patch(':id')
  async updateBox(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: { name?: string; profileImage?: string | null; plantId?: number },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    let userPlant: any = null;
    let box: any = null;

    if (dto.plantId) {
      userPlant = await this.userPlantService.create(
        {
          boxId: id,
          plantId: dto.plantId,
        },
        user.uid,
      );
    }

    if (dto.name !== undefined || dto.profileImage !== undefined) {
      box = await this.boxService.updateProfile(
        id,
        user.uid,
        dto.name,
        dto.profileImage,
      );
    }

    return {
      message: 'Dispositivo actualizado exitosamente',
      data: userPlant,
      box,
    };
  }

  @Patch(':id/location')
  async updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const box = await this.boxService.updateLocation(
      id,
      user.uid,
      dto.latitude,
      dto.longitude,
      dto.locationName,
    );
    return {
      message: 'Ubicación actualizada exitosamente',
      data: {
        id: box.id,
        locationName: box.locationName,
        latitude: box.latitude,
        longitude: box.longitude,
      },
    };
  }

  @Post(':id/actuators')
  @HttpCode(HttpStatus.OK)
  async controlActuators(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { led?: boolean; pump?: boolean },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const box = await this.boxService.getBoxInfo(id, user.uid);
    if (!box) throw new NotFoundException('Dispositivo no encontrado');

    const currentState = this.sensorsService.getActuatorStatus(id);
    let newWateringCount = currentState?.wateringCount ?? 0;
    let newLastWateringDate = currentState?.lastWateringDate ?? null;

    const targetLed = dto.led !== undefined ? dto.led : currentState.led;
    const targetPump = dto.pump !== undefined ? dto.pump : currentState.pump;

    if (targetPump && !currentState.pump) {
      newWateringCount += 1;
      newLastWateringDate = new Date().toISOString();
    }

    const newState = {
      boxId: id,
      boxName: box.box.name,
      led: targetLed,
      pump: targetPump,
      wateringCount: newWateringCount,
      lastWateringDate: newLastWateringDate,
    };
    this.sensorsService.setActuatorStatus(id, newState);

    if (box.box.userPlantId) {
      this.websocketGateway.emitToRoom(
        `plant:${box.box.userPlantId}`,
        'command:control',
        {
          userPlantId: box.box.userPlantId,
          boxId: id,
          pump: targetPump,
          light: targetLed,
          reason: 'Control manual desde el frontend',
        },
      );
    }

    return {
      success: true,
      message: 'Actuadores actualizados correctamente',
      data: newState,
    };
  }

  @Post(':id/token')
  @HttpCode(HttpStatus.OK)
  async registerToken(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterFcmTokenDto,
  ) {
    await this.boxService.registerToken(id, dto.token);
    return { message: 'Token registrado exitosamente' };
  }

  @Delete('token')
  async removeToken(@Body() dto: RemoveFcmTokenDto) {
    await this.boxService.removeToken(dto.token);
    return { message: 'Token removido exitosamente' };
  }
}
