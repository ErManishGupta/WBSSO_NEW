import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { JwksModule } from './jwks/jwks.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PortalsModule } from './portals/portals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    JwksModule,
    AuthModule,
    DashboardModule,
    PortalsModule,
    NotificationsModule,
    AdminModule,
  ],
})
export class AppModule {}
