import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user notifications' })
  async getNotifications(@CurrentUser() user: User) {
    return await this.notificationsService.getUserNotifications(user);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Mark specific notification as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.notificationsService.markAsRead(id, user);
  }

  @Patch('read/all')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: User) {
    return await this.notificationsService.markAllAsRead(user);
  }
}
