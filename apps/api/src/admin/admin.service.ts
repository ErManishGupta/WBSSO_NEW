import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PortalStatus, AccountStatus, UserType, LinkingMethod, User } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  // Portals CRUD
  async getPortals() {
    return await this.prisma.portal.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { accounts: true },
        },
      },
    });
  }

  async createPortal(
    data: {
      slug: string;
      nameEn: string;
      nameBn: string;
      descriptionEn: string;
      descriptionBn: string;
      iconKey: string;
      baseUrl: string;
      launchUrl: string;
      linkingMethod?: LinkingMethod;
      status?: PortalStatus;
      allowedUserTypes: UserType[];
      sortOrder?: number;
    },
    admin: User
  ) {
    const existing = await this.prisma.portal.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException('Portal with this slug already exists');
    }

    const portal = await this.prisma.portal.create({
      data: {
        slug: data.slug,
        nameEn: data.nameEn,
        nameBn: data.nameBn,
        descriptionEn: data.descriptionEn,
        descriptionBn: data.descriptionBn,
        iconKey: data.iconKey || 'ExternalLink',
        baseUrl: data.baseUrl,
        launchUrl: data.launchUrl,
        linkingMethod: data.linkingMethod || 'SIGNED_TOKEN_HANDOFF',
        status: data.status || 'ACTIVE',
        allowedUserTypes: data.allowedUserTypes,
        sortOrder: data.sortOrder || 0,
      },
    });

    await this.auditService.logAction({
      actorId: admin.id,
      action: 'ADMIN_PORTAL_CREATE',
      entityType: 'Portal',
      entityId: portal.id,
      metadata: { slug: portal.slug, nameEn: portal.nameEn },
    });

    return portal;
  }

  async updatePortal(
    id: string,
    data: Partial<{
      nameEn: string;
      nameBn: string;
      descriptionEn: string;
      descriptionBn: string;
      iconKey: string;
      baseUrl: string;
      launchUrl: string;
      linkingMethod: LinkingMethod;
      status: PortalStatus;
      allowedUserTypes: UserType[];
      sortOrder: number;
    }>,
    admin: User
  ) {
    const portal = await this.prisma.portal.findUnique({ where: { id } });
    if (!portal) throw new NotFoundException('Portal not found');

    const updated = await this.prisma.portal.update({
      where: { id },
      data,
    });

    await this.auditService.logAction({
      actorId: admin.id,
      action: 'ADMIN_PORTAL_UPDATE',
      entityType: 'Portal',
      entityId: id,
      metadata: data as any,
    });

    return updated;
  }

  // Accounts Management
  async getAccounts(query?: { search?: string; status?: AccountStatus; portalId?: string }) {
    const where: any = {};

    if (query?.status) where.status = query.status;
    if (query?.portalId) where.portalId = query.portalId;
    if (query?.search) {
      where.OR = [
        { externalUserId: { contains: query.search, mode: 'insensitive' } },
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { username: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return await this.prisma.portalAccount.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            mobile: true,
            userType: true,
          },
        },
        portal: true,
      },
      orderBy: { linkedAt: 'desc' },
    });
  }

  async updateAccountStatus(accountId: string, status: AccountStatus, admin: User) {
    const account = await this.prisma.portalAccount.findUnique({
      where: { id: accountId },
      include: { portal: true, user: true },
    });

    if (!account) throw new NotFoundException('Portal account mapping not found');

    const updated = await this.prisma.portalAccount.update({
      where: { id: accountId },
      data: { status },
    });

    await this.auditService.logAction({
      actorId: admin.id,
      action: `ADMIN_ACCOUNT_${status}`,
      entityType: 'PortalAccount',
      entityId: accountId,
      metadata: {
        userId: account.userId,
        username: account.user.username,
        portalSlug: account.portal.slug,
        previousStatus: account.status,
        newStatus: status,
      },
    });

    return updated;
  }

  // Audit Logs
  async getAuditLogs(filters?: {
    action?: string;
    actorId?: string;
    entityType?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.actorId) where.actorId = filters.actorId;
    if (filters?.entityType) where.entityType = filters.entityType;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              username: true,
              name: true,
              userType: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async exportAuditCsv(): Promise<string> {
    const logs = await this.prisma.auditLog.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { username: true, name: true, userType: true } },
      },
    });

    const headers = ['Timestamp', 'Actor Username', 'Actor Name', 'Role', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
    const rows = logs.map((l) => [
      `"${l.createdAt.toISOString()}"`,
      `"${l.actor?.username || l.actorId}"`,
      `"${l.actor?.name || ''}"`,
      `"${l.actor?.userType || ''}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.entityId}"`,
      `"${l.ip}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
