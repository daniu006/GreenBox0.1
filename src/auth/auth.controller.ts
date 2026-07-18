import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from 'src/shared/decorators/current-user.decorator';
import { BoxService } from 'src/box/box.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly boxService: BoxService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      message: 'Usuario registrado exitosamente',
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      message: 'Inicio de sesion exitoso',
      data: result,
    };
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async getIdToken(@Body() dto: LoginDto) {
    const result = await this.authService.getIdToken(dto);
    return { message: 'ID token obtenido', data: result };
  }

  @Post('validate')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validateCode(
    @Body() dto: { code: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.boxService.validateCode(dto.code, user.uid, user.email);
    return {
      message: 'Dispositivo validado exitosamente',
      data: {
        box: {
          id: result.box.id,
          code: result.box.code,
          locationName: result.box.locationName,
          hasLocation: this.boxService.hasLocation(result.box),
        },
        userPlantId: result.userPlantId,
        plant: result.plant,
      },
    };
  }

  @Post('register-send-code')
  @HttpCode(HttpStatus.OK)
  async registerSendCode(
    @Body() dto: { email: string; name: string; firebaseUid?: string },
  ) {
    const emailLower = dto.email.trim().toLowerCase();
    const userName = dto.name?.trim() || 'Usuario GreenBox';

    if (dto.firebaseUid) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: dto.firebaseUid },
      });

      if (!userExists) {
        const userByEmail = await this.prisma.user.findUnique({
          where: { email: emailLower },
        });

        if (userByEmail) {
          await this.prisma.user.update({
            where: { email: emailLower },
            data: { id: dto.firebaseUid },
          });
          this.logger.log(`Usuario actualizado con nuevo Firebase ID: ${dto.firebaseUid}`);
        } else {
          await this.prisma.user.create({
            data: {
              id: dto.firebaseUid,
              email: emailLower,
              name: userName,
              password: '',
            },
          });
          this.logger.log(`Usuario creado en Postgres desde registro: ${dto.firebaseUid}`);
        }
      }
    }

    const userForBox = dto.firebaseUid
      ? await this.prisma.user.findUnique({
          where: { id: dto.firebaseUid },
          include: { boxes: true },
        })
      : await this.prisma.user.findUnique({
          where: { email: emailLower },
          include: { boxes: true },
        });

    let code = '';

    if (userForBox?.boxes?.length) {
      code = userForBox.boxes[0].code;
      this.logger.log(`Reutilizando codigo existente ${code} para el correo ${emailLower}`);
    } else {
      let codeExists = true;

      while (codeExists) {
        code = 'GB' + Math.floor(1000 + Math.random() * 9000);
        const exists = await this.prisma.box.findUnique({ where: { code } });
        if (!exists) {
          codeExists = false;
        }
      }

      await this.prisma.box.create({
        data: {
          code,
          locationName: `Caja de ${userName}`,
          userId: null,
        },
      });
      this.logger.log(`Generando nuevo codigo ${code} desvinculado para el correo ${emailLower}`);
    }

    try {
      await this.mailService.sendBoxCode(emailLower, userName, code);

      return {
        valid: true,
        emailSent: true,
        message: 'Te enviamos tu codigo de acceso al correo registrado.',
      };
    } catch (error: any) {
      this.logger.error(`Error enviando correo a ${emailLower}: ${error.message}`);
      throw new ServiceUnavailableException(
        'No se pudo enviar el codigo de acceso por correo. Intenta de nuevo en unos minutos.',
      );
    }
  }

  @Post('validate-code-login')
  @HttpCode(HttpStatus.OK)
  async validateCodeLogin(
    @Body() dto: { code: string; email?: string; firebaseUid?: string },
  ) {
    const codeUpper = dto.code.trim().toUpperCase();

    const box = await this.prisma.box.findUnique({
      where: { code: codeUpper },
    });

    if (!box) {
      throw new NotFoundException('El codigo del dispositivo no existe');
    }

    let targetUserId = box.userId;

    if (!targetUserId) {
      if (!dto.firebaseUid) {
        throw new ForbiddenException(
          'Este dispositivo no esta vinculado a ningun usuario y no se proporciono un UID para vincularlo',
        );
      }

      let user = await this.prisma.user.findUnique({
        where: { id: dto.firebaseUid },
      });

      if (!user) {
        if (!dto.email) {
          throw new NotFoundException(
            'El usuario no existe en la base de datos y falta el correo para crearlo',
          );
        }

        user = await this.prisma.user.create({
          data: {
            id: dto.firebaseUid,
            email: dto.email.trim().toLowerCase(),
            name: dto.email.split('@')[0],
            password: '',
          },
        });
        this.logger.log(`Usuario creado de emergencia en validateCodeLogin: ${user.id}`);
      }

      await this.prisma.box.update({
        where: { id: box.id },
        data: { userId: user.id },
      });
      targetUserId = user.id;
      this.logger.log(`Caja ${box.code} vinculada al usuario ${user.id} exitosamente`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException(
        'El usuario del dispositivo no existe en la base de datos',
      );
    }

    let firebaseToken: string;
    try {
      firebaseToken = await admin.auth().createCustomToken(user.id);
    } catch (error) {
      this.logger.error('Error generando token de Firebase en login por codigo', error);
      throw new InternalServerErrorException('Error al iniciar sesion');
    }

    const activeUserPlant = await this.prisma.userPlant.findFirst({
      where: { boxId: box.id, userId: user.id, archivedAt: null },
      include: { plant: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Inicio de sesion exitoso con codigo',
      data: {
        firebaseToken,
        user: {
          uid: user.id,
          email: user.email,
          name: user.name,
        },
        box: {
          id: box.id,
          code: box.code,
          locationName: box.locationName || `Caja de ${user.name}`,
          profileImage: box.profileImage || null,
          hasLocation: this.boxService.hasLocation(box as any),
        },
        userPlantId: activeUserPlant?.id || null,
        plant: activeUserPlant?.plant
          ? {
              id: activeUserPlant.plant.id,
              name: activeUserPlant.plant.name,
              category: activeUserPlant.plant.category,
              minTemperature: activeUserPlant.plant.minTemperature,
              maxTemperature: activeUserPlant.plant.maxTemperature,
              minHumidity: activeUserPlant.plant.minHumidity,
              maxHumidity: activeUserPlant.plant.maxHumidity,
              lightHours: activeUserPlant.plant.lightHours,
              minWaterLevel: activeUserPlant.plant.minWaterLevel,
              minSoilMoisture: activeUserPlant.plant.minSoilMoisture,
              wateringFrequency: activeUserPlant.plant.wateringFrequency,
            }
          : null,
      },
    };
  }
}
