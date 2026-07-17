import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Logger, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { CurrentUser, CurrentUserPayload } from 'src/shared/decorators/current-user.decorator';
import { BoxService } from 'src/box/box.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import * as admin from 'firebase-admin';

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
      message: 'Inicio de sesión exitoso',
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
  async registerSendCode(@Body() dto: { email: string; name: string; firebaseUid?: string }) {
    const emailLower = dto.email.trim().toLowerCase();

    // 1. Si viene firebaseUid, asegurar que el usuario existe en Postgres (Neon)
    if (dto.firebaseUid) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: dto.firebaseUid },
      });
      if (!userExists) {
        // También verificar por correo por si acaso existe con otro id viejo
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
              name: dto.name,
              password: '',
            },
          });
          this.logger.log(`Usuario creado en Postgres desde registro: ${dto.firebaseUid}`);
        }
      }
    }

    // 2. Buscar si el usuario ya tiene una caja vinculada
    // Priorizamos buscar por firebaseUid si está disponible
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

    // 3. Si el usuario existe y ya tiene una caja vinculada, reutilizar su código existente
    if (userForBox && userForBox.boxes && userForBox.boxes.length > 0) {
      code = userForBox.boxes[0].code;
      this.logger.log(`Reutilizando código existente ${code} para el correo ${emailLower}`);
    } else {
      // 4. Generar código nuevo tipo GB1234
      let codeExists = true;
      while (codeExists) {
        code = 'GB' + Math.floor(1000 + Math.random() * 9000);
        const exists = await this.prisma.box.findUnique({ where: { code } });
        if (!exists) codeExists = false;
      }

      // Crear la caja en la DB de forma desvinculada (se vinculará al validar el código)
      await this.prisma.box.create({
        data: {
          code,
          locationName: `Caja de ${dto.name}`,
          userId: null, // <-- Inicialmente null, obliga a pasar por la validación del código para vincular!
        },
      });
      this.logger.log(`Generando nuevo código ${code} desvinculado para el correo ${emailLower}`);
    }

    // Enviar el código al correo del usuario en segundo plano (sin await)
    // para que la API responda inmediatamente y no sufra de timeouts
    this.mailService.sendBoxCode(emailLower, dto.name, code)
      .then(() => this.logger.log(`✅ Código ${code} enviado a ${emailLower}`))
      .catch((emailError) => {
        this.logger.error(`❌ Error enviando correo a ${emailLower}: ${emailError.message}`);
      });

    return {
      valid: true,
      message: 'Código de acceso procesado y enviado a tu correo',
      code, // También lo devolvemos en la respuesta como respaldo
    };
  }

  @Post('validate-code-login')
  @HttpCode(HttpStatus.OK)
  async validateCodeLogin(@Body() dto: { code: string; email?: string; firebaseUid?: string }) {
    const codeUpper = dto.code.trim().toUpperCase();

    // 1. Buscar la caja por código
    const box = await this.prisma.box.findUnique({
      where: { code: codeUpper },
    });

    if (!box) {
      throw new NotFoundException('El código del dispositivo no existe');
    }

    let targetUserId = box.userId;

    // 2. Si la caja no está vinculada a ningún usuario, la vinculamos al usuario actual
    if (!targetUserId) {
      if (!dto.firebaseUid) {
        throw new ForbiddenException('Este dispositivo no está vinculado a ningún usuario y no se proporcionó un UID de usuario para vincularlo');
      }

      // Verificar si el usuario existe en Postgres (creado en register-send-code)
      let user = await this.prisma.user.findUnique({
        where: { id: dto.firebaseUid },
      });

      if (!user) {
        if (!dto.email) {
          throw new NotFoundException('El usuario no existe en la base de datos y falta el correo para crearlo');
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

      // Vincular la caja al usuario
      await this.prisma.box.update({
        where: { id: box.id },
        data: { userId: user.id },
      });
      targetUserId = user.id;
      this.logger.log(`Caja ${box.code} vinculada al usuario ${user.id} exitosamente`);
    }

    // 3. Obtener el usuario de Postgres
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('El usuario del dispositivo no existe en la base de datos');
    }

    // 4. Generar un token personalizado de Firebase para este usuario
    let firebaseToken: string;
    try {
      firebaseToken = await admin.auth().createCustomToken(user.id);
    } catch (error) {
      this.logger.error('Error generando token de Firebase en login por código', error);
      throw new InternalServerErrorException('Error al iniciar sesión');
    }

    // Buscar si hay planta activa
    const activeUserPlant = await this.prisma.userPlant.findFirst({
      where: { boxId: box.id, userId: user.id, archivedAt: null },
      include: { plant: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Inicio de sesión exitoso con código',
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