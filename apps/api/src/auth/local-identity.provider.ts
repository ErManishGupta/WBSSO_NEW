import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityProvider, AuthenticationResult } from './identity-provider.interface';
import * as argon2 from 'argon2';

@Injectable()
export class LocalIdentityProvider implements IdentityProvider {
  private readonly logger = new Logger(LocalIdentityProvider.name);
  private readonly maxFailedAttempts = parseInt(process.env.ACCOUNT_LOCKOUT_MAX_ATTEMPTS || '5', 10);
  private readonly lockoutDurationMs = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MINUTES || '15', 10) * 60 * 1000;
  private readonly mockOtpEnabled = process.env.MOCK_OTP_ENABLED !== 'false';
  private readonly mockOtpCode = process.env.MOCK_OTP_CODE || '123456';

  constructor(private readonly prisma: PrismaService) {}

  async authenticate(credentials: {
    identifier: string;
    password?: string;
    ip?: string;
  }): Promise<AuthenticationResult> {
    const { identifier, password } = credentials;

    // Find by username, email, or mobile
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
          { mobile: identifier },
        ],
      },
    });

    if (!user) {
      return { success: false, error: 'Invalid username, mobile, or password' };
    }

    // Check account lockout status
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      return {
        success: false,
        isLocked: true,
        lockedUntil: user.lockedUntil,
        error: `Account is temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minute(s).`,
      };
    }

    // Verify password if provided
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    let isValid = false;
    try {
      isValid = await argon2.verify(user.passwordHash, password);
    } catch (e) {
      this.logger.error(`Argon2 verification failed for user: ${user.username}`, e);
      return { success: false, error: 'Authentication failed' };
    }

    if (!isValid) {
      const updatedFailedLogins = user.failedLogins + 1;
      let lockedUntil: Date | null = null;

      if (updatedFailedLogins >= this.maxFailedAttempts) {
        lockedUntil = new Date(Date.now() + this.lockoutDurationMs);
        this.logger.warn(`User ${user.username} locked out until ${lockedUntil.toISOString()}`);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: updatedFailedLogins,
          lockedUntil,
        },
      });

      if (lockedUntil) {
        return {
          success: false,
          isLocked: true,
          lockedUntil,
          error: `Account locked for ${Math.round(this.lockoutDurationMs / 60000)} minutes due to ${this.maxFailedAttempts} consecutive failed attempts.`,
        };
      }

      return {
        success: false,
        error: `Invalid credentials. Attempt ${updatedFailedLogins} of ${this.maxFailedAttempts}.`,
      };
    }

    // Successful password match: reset failed logins and lockout
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    return {
      success: true,
      user,
    };
  }

  async verifyOtp(params: {
    identifier: string;
    code: string;
    ip?: string;
  }): Promise<AuthenticationResult> {
    const { identifier, code } = params;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { mobile: identifier },
          { email: identifier },
        ],
      },
    });

    if (!user) {
      return { success: false, error: 'Account not found for provided identifier' };
    }

    // Check lockout
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      return {
        success: false,
        isLocked: true,
        lockedUntil: user.lockedUntil,
        error: 'Account is temporarily locked. Please try again later.',
      };
    }

    // Dev mock OTP validation
    if (this.mockOtpEnabled) {
      this.logger.log(`[DEV OTP] Validating code for ${identifier}. Accepted code: ${this.mockOtpCode}`);
      if (code === this.mockOtpCode) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLogins: 0, lockedUntil: null },
        });
        return { success: true, user };
      }
    }

    return { success: false, error: 'Invalid or expired OTP code' };
  }
}
