import { Global, Module } from '@nestjs/common';
import { JwksService } from './jwks.service';
import { JwksController } from './jwks.controller';

@Global()
@Module({
  controllers: [JwksController],
  providers: [JwksService],
  exports: [JwksService],
})
export class JwksModule {}
