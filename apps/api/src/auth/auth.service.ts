import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IDENTITY_PROVIDER, IdentityProvider } from './identity-provider.interface';
import { AuditService } from '../audit/audit.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly sessionMaxAgeMs = parseInt(
    process.env.SESSION_MAX_AGE_MS || '86400000',
    10
  );

  constructor(
    private readonly prisma: PrismaService,
    @Inject(IDENTITY_PROVIDER) private readonly identityProvider: IdentityProvider,
    private readonly auditService: AuditService
  ) {}

  async login(
    identifier: string,
    password?: string,
    ip = '127.0.0.1',
    userAgent = 'Browser'
  ) {
    const result = await this.identityProvider.authenticate({
      identifier,
      password,
      ip,
    });

    if (!result.success || !result.user) {
      throw new UnauthorizedException(result.error || 'Invalid credentials');
    }

    const session = await this.createSession(result.user.id, ip, userAgent);

    await this.auditService.logAction({
      actorId: result.user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: result.user.id,
      ip,
      userAgent,
      metadata: { method: 'PASSWORD', username: result.user.username },
    });

    return {
      user: this.sanitizeUser(result.user),
      sessionId: session.id,
      expiresAt: session.expiresAt,
    };
  }

  async requestOtp(identifier: string) {
    const cleanId = identifier.trim().replace(/^(\+91)/, '');
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { mobile: cleanId },
          { mobile: identifier },
          { username: identifier },
          { email: identifier },
        ],
      },
    });

    if (!user) {
      throw new BadRequestException('No registered account found for this mobile number');
    }

    const rawMobile = user.mobile || cleanId;
    const last4 = rawMobile.slice(-4);
    const maskedMobile = `XXXXXX${last4}`;

    return {
      success: true,
      message: 'OTP has been sent to your registered mobile number',
      maskedMobile,
      identifier: user.mobile || user.username,
    };
  }

  async verifyOtp(
    identifier: string,
    code: string,
    ip = '127.0.0.1',
    userAgent = 'Browser'
  ) {
    const result = await this.identityProvider.verifyOtp({
      identifier,
      code,
      ip,
    });

    if (!result.success || !result.user) {
      throw new UnauthorizedException(result.error || 'Invalid OTP code');
    }

    const session = await this.createSession(result.user.id, ip, userAgent);

    await this.auditService.logAction({
      actorId: result.user.id,
      action: 'AUTH_OTP_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: result.user.id,
      ip,
      userAgent,
      metadata: { method: 'OTP', username: result.user.username },
    });

    return {
      user: this.sanitizeUser(result.user),
      sessionId: session.id,
      expiresAt: session.expiresAt,
    };
  }

  async logout(sessionId: string, ip = '127.0.0.1', userAgent = 'Browser') {
    if (!sessionId) return;

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (session) {
      await this.prisma.session.delete({
        where: { id: sessionId },
      });

      await this.auditService.logAction({
        actorId: session.userId,
        action: 'AUTH_LOGOUT',
        entityType: 'Session',
        entityId: sessionId,
        ip,
        userAgent,
      });
    }
  }

  async getSession(sessionId: string) {
    if (!sessionId) return null;

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: sessionId } });
      return null;
    }

    return session;
  }

  async getUserSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      ip: s.ip,
      userAgent: s.userAgent,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: s.id === currentSessionId,
    }));
  }

  async terminateSession(userId: string, sessionIdToTerminate: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionIdToTerminate, userId },
    });

    if (!session) {
      throw new BadRequestException('Session not found or not owned by user');
    }

    await this.prisma.session.delete({
      where: { id: sessionIdToTerminate },
    });

    await this.auditService.logAction({
      actorId: userId,
      action: 'AUTH_SESSION_TERMINATED',
      entityType: 'Session',
      entityId: sessionIdToTerminate,
    });
  }

  async terminateOtherSessions(userId: string, currentSessionId: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });

    await this.auditService.logAction({
      actorId: userId,
      action: 'AUTH_OTHER_SESSIONS_TERMINATED',
      entityType: 'Session',
      entityId: currentSessionId,
    });
  }

  private async createSession(userId: string, ip: string, userAgent: string) {
    const expiresAt = new Date(Date.now() + this.sessionMaxAgeMs);
    return await this.prisma.session.create({
      data: {
        userId,
        expiresAt,
        ip,
        userAgent,
      },
    });
  }

  sanitizeUser(user: User) {
    const { passwordHash, failedLogins, lockedUntil, ...safeUser } = user;
    return safeUser;
  }
}
