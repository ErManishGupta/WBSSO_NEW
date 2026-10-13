import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PortalsService } from './portals.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';
import { Request } from 'express';

class LinkConfirmDto {
  challengeId!: string;
  externalUserId?: string;
  codeOrCredential?: string;
}

class VerifyHandoffDto {
  jti!: string;
  portalSlug!: string;
}

@ApiTags('Department Portals & SSO Launch')
@Controller('portals')
export class PortalsController {
  constructor(private readonly portalsService: PortalsService) {}

  @Get('linkable')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get list of department portals user is eligible to link' })
  async getLinkable(@CurrentUser() user: User) {
    return await this.portalsService.getLinkablePortals(user);
  }

  @Post(':id/link/start')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Initiate portal linking challenge' })
  async startLink(@Param('id') portalId: string, @CurrentUser() user: User) {
    return await this.portalsService.startLink(portalId, user);
  }

  @Post(':id/link/confirm')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Confirm linking with verification proof' })
  async confirmLink(
    @Param('id') portalId: string,
    @Body() body: LinkConfirmDto,
    @CurrentUser() user: User,
    @Req() req: Request
  ) {
    const ip = req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';
    return await this.portalsService.confirmLink(portalId, user, body, ip, userAgent);
  }

  @Delete(':id/link')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Unlink portal account' })
  async unlink(
    @Param('id') portalId: string,
    @CurrentUser() user: User,
    @Req() req: Request
  ) {
    const ip = req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';
    return await this.portalsService.unlinkPortal(portalId, user, ip, userAgent);
  }

  @Post(':id/launch')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Generate single-use signed SSO handoff token and launch URL' })
  async launch(
    @Param('id') portalId: string,
    @CurrentUser() user: User,
    @Req() req: Request
  ) {
    const ip = req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';
    return await this.portalsService.launchPortal(portalId, user, ip, userAgent);
  }

  @Post('verify-handoff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal portal verification endpoint to burn used token' })
  async verifyHandoff(@Body() body: VerifyHandoffDto) {
    return await this.portalsService.verifyHandoff(body.jti, body.portalSlug);
  }
}
