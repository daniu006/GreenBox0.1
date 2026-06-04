import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}