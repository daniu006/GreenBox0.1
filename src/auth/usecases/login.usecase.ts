import { Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcrypt';
import { IAuthRepository, AUTH_REPOSITORY } from '../domain/auth.repository.interface';
import { LoginDto } from '../auth.dto';
import { LoginResult } from '../domain/auth.usecase.interface';

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResult> {
    // 1. Buscar usuario en nuestra BD por email
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      // Mensaje genérico — no revelar si el email existe o no
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 2. Verificar contraseña contra el hash guardado
    // IMPORTANTE: esto se valida en el backend, nunca en el frontend
    const passwordValid = await bcrypt.compare(dto.password, user['password']);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 3. Generar token de Firebase para la sesión
    let firebaseToken: string;
    try {
      firebaseToken = await admin.auth().createCustomToken(user.id);
    } catch (error) {
      this.logger.error('Error generando token de Firebase', error);
      throw new UnauthorizedException('Error al iniciar sesión');
    }

    return {
      uid: user.id,
      email: user.email,
      name: user.name,
      token: firebaseToken,
    };
  }
}