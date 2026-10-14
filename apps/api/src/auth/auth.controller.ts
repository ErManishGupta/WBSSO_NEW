import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { User } from '@prisma/client';
import { Request, Response } from 'express';

class LoginDto {
  identifier!: string;
  password?: string;
  useOtp?: boolean;
}

class OtpRequestDto {
  mobile!: string;
}

class OtpVerifyDto {
  identifier!: string;
  code!: string;
}

@ApiTags('Authentication & Sessions')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to registered mobile number' })
  async requestOtp(@Body() body: OtpRequestDto) {
    return this.authService.requestOtp(body.mobile);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login via username/mobile and password' })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';

    const result = await this.authService.login(body.identifier, body.password, ip, userAgent);

    // Set secure HTTP-only cookie
    res.cookie('wb_sso_session', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: result.expiresAt,
    });

    return {
      user: result.user,
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
    };
  }

  @Post('auth/otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code for login' })
  async verifyOtp(
    @Body() body: OtpVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';

    const result = await this.authService.verifyOtp(body.identifier, body.code, ip, userAgent);

    res.cookie('wb_sso_session', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: result.expiresAt,
    });

    return {
      user: result.user,
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
    };
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate active session and clear cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.wb_sso_session || (req.headers['x-session-id'] as string);
    const ip = req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';

    if (sessionId) {
      await this.authService.logout(sessionId, ip, userAgent);
    }

    res.clearCookie('wb_sso_session', { path: '/' });
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user profile and session info' })
  async getMe(@CurrentUser() user: User, @Req() req: any) {
    return {
      user: this.authService.sanitizeUser(user),
      session: {
        id: req.session.id,
        expiresAt: req.session.expiresAt,
        createdAt: req.session.createdAt,
      },
    };
  }

  @Get('me/sessions')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List all active sessions for current user' })
  async getMySessions(@CurrentUser() user: User, @Req() req: any) {
    return await this.authService.getUserSessions(user.id, req.session.id);
  }

  @Delete('me/sessions/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Terminate specific session or other sessions' })
  async terminateSession(
    @CurrentUser() user: User,
    @Param('id') sessionIdToTerminate: string,
    @Req() req: any
  ) {
    if (sessionIdToTerminate === 'others') {
      await this.authService.terminateOtherSessions(user.id, req.session.id);
      return { success: true, message: 'All other sessions terminated' };
    }

    await this.authService.terminateSession(user.id, sessionIdToTerminate);
    return { success: true, message: 'Session terminated' };
  }
}
