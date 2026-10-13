import { Module } from '@nestjs/common';
import { PortalsController } from './portals.controller';
import { PortalsService } from './portals.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PortalsController],
  providers: [PortalsService],
  exports: [PortalsService],
})
export class PortalsModule {}
