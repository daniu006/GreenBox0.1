import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RegisterUseCase } from './usecases/register.usecase';
import { LoginUseCase } from './usecases/login.usecase';
import { RegisterDto, LoginDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  // POST /auth/register
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const result = await this.registerUseCase.execute(dto);
    return {
      message: 'Usuario registrado exitosamente',
      data: {
        uid: result.uid,
        email: result.email,
        name: result.name,
        token: result.token,
      },
    };
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(dto);
    return {
      message: 'Inicio de sesión exitoso',
      data: {
        uid: result.uid,
        email: result.email,
        name: result.name,
        token: result.token,
      },
    };
  }
}