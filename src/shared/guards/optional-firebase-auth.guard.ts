import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

/**
 * Igual que FirebaseAuthGuard, pero NUNCA bloquea la petición.
 * - Si viene un token válido -> llena request.user (uid, email).
 * - Si no viene token, o el token es inválido -> deja request.user = undefined
 *   y de todas formas permite continuar (canActivate siempre retorna true).
 *
 * Úsalo en endpoints públicos que, opcionalmente, quieren saber quién es
 * el usuario para personalizar la respuesta (ej: GET /plant).
 * NO lo uses en endpoints que deben exigir sesión (ahí sigue siendo
 * FirebaseAuthGuard, que sí bloquea).
 */
@Injectable()
export class OptionalFirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalFirebaseAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true; // sin token: sigue como anónimo
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
    } catch (error) {
      this.logger.warn(`Token opcional inválido, se ignora: ${error.message}`);
      // No lanzamos error: seguimos como anónimo.
    }

    return true;
  }
}
