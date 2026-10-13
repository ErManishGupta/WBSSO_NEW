import { User } from '@prisma/client';

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  error?: string;
  isLocked?: boolean;
  lockedUntil?: Date;
  requiresOtp?: boolean;
}

export interface IdentityProvider {
  /**
   * Authenticate a user via primary credentials (username/mobile and password).
   */
  authenticate(credentials: {
    identifier: string;
    password?: string;
    ip?: string;
  }): Promise<AuthenticationResult>;

  /**
   * Verify a one-time passcode for multi-factor or passwordless authentication.
   */
  verifyOtp(params: {
    identifier: string;
    code: string;
    ip?: string;
  }): Promise<AuthenticationResult>;
}

export const IDENTITY_PROVIDER = Symbol('IDENTITY_PROVIDER');
