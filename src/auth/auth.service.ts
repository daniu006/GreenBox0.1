import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { RegisterDto, LoginDto } from './auth.dto';

export interface AuthResult {
  uid: string;
  email: string;
  name: string;
  token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly authRepository: AuthRepository) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const exists = await this.authRepository.emailExists(dto.email);
    if (exists) {
      throw new ConflictException('El correo ya está registrado');
    }

    let firebaseUid: string;
    let firebaseToken: string;

    try {
      const firebaseUser = await admin.auth().createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.name,
      });
      firebaseUid = firebaseUser.uid;
      firebaseToken = await admin.auth().createCustomToken(firebaseUid);
    } catch (error) {
      this.logger.error('Error creando usuario en Firebase', error);
      if (error.code === 'auth/email-already-exists') {
        throw new ConflictException('El correo ya está registrado');
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.authRepository.create(
      firebaseUid,
      dto.email,
      dto.name,
      passwordHash,
    );

    return {
      uid: user.id,
      email: user.email,
      name: user.name,
      token: firebaseToken,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

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
  async getIdToken(dto: LoginDto): Promise<AuthResult> {
    const apiKey = process.env.FIREBASE_API_KEY;
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: dto.email,
          password: dto.password,
          returnSecureToken: true,
        }),
      },
    );
    const data = await response.json();
    if (data.error) throw new UnauthorizedException('Credenciales incorrectas');
    return {
      uid: data.localId,
      email: data.email,
      name: data.displayName,
      token: data.idToken,
    };
  }
}
