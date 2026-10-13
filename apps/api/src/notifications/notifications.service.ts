import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(user: User) {
    return await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { portal: true },
    });
  }

  async markAsRead(notificationId: string, user: User) {
    const notif = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId: user.id },
    });

    if (!notif) {
      throw new NotFoundException('Notification not found');
    }

    return await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(user: User) {
    return await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
