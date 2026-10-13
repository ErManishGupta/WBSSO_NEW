import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwksService } from './jwks.service';

@ApiTags('OpenID Connect & JWKS')
@Controller()
export class JwksController {
  constructor(private readonly jwksService: JwksService) {}

  @Get('.well-known/jwks.json')
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ summary: 'Standard JWKS endpoint returning public keys for token validation' })
  getJwks() {
    return this.jwksService.getJwks();
  }
}
