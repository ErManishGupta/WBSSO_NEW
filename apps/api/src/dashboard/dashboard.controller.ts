import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Unified Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get entitled portal tiles and user dashboard summary' })
  async getDashboard(@CurrentUser() user: User) {
    return await this.dashboardService.getDashboardData(user);
  }
}
