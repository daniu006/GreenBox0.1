import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
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

      // Crear la caja en la DB asignándole el usuario de una vez si lo tenemos
      await this.prisma.box.create({
        data: {
          code,
          locationName: `Caja de ${dto.name}`,
          userId: userForBox ? userForBox.id : null,
        },
      });
      this.logger.log(`Generando nuevo código ${code} para el correo ${emailLower} y asignándolo de inmediato`);
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
}