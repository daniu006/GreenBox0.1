import { Controller, Post, Patch, Get, Delete, Body, Param, ParseIntPipe, UseGuards,HttpCode, HttpStatus,} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from 'src/shared/decorators/current-user.decorator';
import { BoxService } from './box.service';
import { ValidateCodeDto, UpdateLocationDto, RegisterFcmTokenDto, RemoveFcmTokenDto } from './box.dto';

@Controller('box')
@UseGuards(FirebaseAuthGuard)
export class BoxController {
  constructor(private readonly boxService: BoxService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateCode(
    @Body() dto: ValidateCodeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.boxService.validateCode(dto.code, user.uid);
    return {
      message: 'Dispositivo validado exitosamente',
      data: {
        box: {
          id: result.box.id,
          code: result.box.code,
          locationName: result.box.locationName,
          hasLocation: this.boxService.hasLocation(result.box),
        },
        plant: result.plant,
      },
    };
  }

  @Get()
  async getMyBoxes(@CurrentUser() user: CurrentUserPayload) {
    const boxes = await this.boxService.getByUser(user.uid);
    return {
      message: 'Dispositivos obtenidos exitosamente',
      data: boxes.map(b => ({
        id: b.id,
        code: b.code,
        locationName: b.locationName,
        latitude: b.latitude,
        longitude: b.longitude,
        hasLocation: this.boxService.hasLocation(b),
      })),
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