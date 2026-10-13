import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(params: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          ip: params.ip || '127.0.0.1',
          userAgent: params.userAgent || 'Unknown Agent',
          metadata: (params.metadata || {}) as any,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log for action: ${params.action}`, error);
    }
  }
}
