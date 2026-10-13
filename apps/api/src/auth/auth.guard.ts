import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId =
      request.cookies?.wb_sso_session ||
      request.headers['x-session-id'] ||
      (request.headers.authorization?.startsWith('Bearer ')
        ? request.headers.authorization.substring(7)
        : null);

    if (!sessionId) {
      throw new UnauthorizedException('Authentication session required');
    }

    const session = await this.authService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    request.user = session.user;
    request.session = session;
    return true;
  }
}
