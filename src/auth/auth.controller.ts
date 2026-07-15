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
  async registerSendCode(@Body() dto: { email: string; name: string }) {
    // Generar código único tipo GB1234
    let code = '';
    let codeExists = true;
    while (codeExists) {
      code = 'GB' + Math.floor(1000 + Math.random() * 9000);
      const exists = await this.prisma.box.findUnique({ where: { code } });
      if (!exists) codeExists = false;
    }

    // Crear el box en la DB sin asignar a ningún usuario todavía
    await this.prisma.box.create({
      data: {
        code,
        locationName: `Caja de ${dto.name}`,
      }
    });

    // Enviar el código al correo del usuario
    try {
      await this.mailService.sendBoxCode(dto.email, dto.name, code);
      this.logger.log(`✅ Código ${code} enviado a ${dto.email}`);
    } catch (emailError) {
      this.logger.error(`❌ Error enviando correo a ${dto.email}: ${emailError.message}`);
      // El box ya fue creado — devolvemos el código también en la respuesta
      // para que el usuario pueda continuar aunque el correo haya fallado
    }

    return {
      valid: true,
      message: 'Código de acceso generado y enviado a tu correo',
      code, // También lo devolvemos en la respuesta como respaldo
    };
  }
}