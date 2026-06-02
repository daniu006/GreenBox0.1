import { Inject, Injectable, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcrypt';
import { IAuthRepository, AUTH_REPOSITORY } from '../domain/auth.repository.interface';
import { RegisterDto } from '../auth.dto';
import { RegisterResult } from '../domain/auth.usecase.interface';

@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: RegisterDto): Promise<RegisterResult> {
    // 1. Verificar si el email ya existe en nuestra BD
    const exists = await this.authRepository.emailExists(dto.email);
    if (exists) {
      throw new ConflictException('El correo ya está registrado');
    }

    let firebaseUid: string;
    let firebaseToken: string;

    try {
      // 2. Crear usuario en Firebase Auth
      const firebaseUser = await admin.auth().createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.name,
      });
      firebaseUid = firebaseUser.uid;

      // 3. Generar custom token para que la app pueda hacer login
      firebaseToken = await admin.auth().createCustomToken(firebaseUid);
    } catch (error) {
      this.logger.error('Error creando usuario en Firebase', error);
      if (error.code === 'auth/email-already-exists') {
        throw new ConflictException('El correo ya está registrado');
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }

    // 4. Hashear la contraseña para guardarla en nuestra BD
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 5. Guardar usuario en PostgreSQL con el UID de Firebase
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
}