import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IDENTITY_PROVIDER } from './identity-provider.interface';
import { LocalIdentityProvider } from './local-identity.provider';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    RolesGuard,
    {
      provide: IDENTITY_PROVIDER,
      useClass: LocalIdentityProvider,
    },
  ],
  exports: [AuthService, AuthGuard, RolesGuard],
})
export class AuthModule {}
