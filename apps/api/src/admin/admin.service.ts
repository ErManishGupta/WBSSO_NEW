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
        slug: data.slug.trim().toLowerCase(),
        nameEn: data.nameEn.trim(),
        nameBn: (data.nameBn && data.nameBn.trim()) ? data.nameBn.trim() : data.nameEn.trim(),
        descriptionEn: data.descriptionEn?.trim() || '',
        descriptionBn: (data.descriptionBn && data.descriptionBn.trim()) ? data.descriptionBn.trim() : (data.descriptionEn?.trim() || ''),
        iconKey: data.iconKey?.trim() || 'ExternalLink',
        baseUrl: data.baseUrl?.trim() || data.launchUrl.trim(),
        launchUrl: data.launchUrl.trim(),
        linkingMethod: data.linkingMethod || 'SIGNED_TOKEN_HANDOFF',
        status: data.status || 'ACTIVE',
        allowedUserTypes: data.allowedUserTypes?.length ? data.allowedUserTypes : ['APPLICANT', 'OFFICER'],
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

  // Executive KPI Stats & Health
  async getStats() {
    const now = new Date();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalPortals,
      activePortals,
      maintenancePortals,
      totalAccounts,
      activeAccounts,
      totalUsers,
      activeSessions,
      totalAuditLogs,
      todayAuditLogs,
    ] = await Promise.all([
      this.prisma.portal.count(),
      this.prisma.portal.count({ where: { status: 'ACTIVE' } }),
      this.prisma.portal.count({ where: { status: 'MAINTENANCE' } }),
      this.prisma.portalAccount.count(),
      this.prisma.portalAccount.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count(),
      this.prisma.session.count({ where: { expiresAt: { gt: now } } }),
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
    ]);

    return {
      totalPortals,
      activePortals,
      maintenancePortals,
      totalAccounts,
      activeAccounts,
      totalUsers,
      activeSessions,
      totalAuditLogs,
      todayAuditLogs,
      systemHealth: 'OPERATIONAL',
      keyAlgorithm: 'RS256 (2048-bit RSA)',
    };
  }

  // Delete Portal
  async deletePortal(id: string, admin: User) {
    const portal = await this.prisma.portal.findUnique({ where: { id } });
    if (!portal) throw new NotFoundException('Portal not found');

    await this.prisma.portal.delete({ where: { id } });

    await this.auditService.logAction({
      actorId: admin.id,
      action: 'ADMIN_PORTAL_DELETE',
      entityType: 'Portal',
      entityId: id,
      metadata: { slug: portal.slug, nameEn: portal.nameEn },
    });

    return { success: true, message: `Portal ${portal.slug} deregistered successfully` };
  }

  // Active SSO Sessions
  async getActiveSessions() {
    const now = new Date();
    return await this.prisma.session.findMany({
      where: { expiresAt: { gt: now } },
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
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Terminate Specific Session
  async terminateSession(sessionId: string, admin: User) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    await this.prisma.session.delete({ where: { id: sessionId } });

    await this.auditService.logAction({
      actorId: admin.id,
      action: 'ADMIN_SESSION_TERMINATED',
      entityType: 'Session',
      entityId: sessionId,
      metadata: {
        userId: session.userId,
        username: session.user.username,
        userType: session.user.userType,
        ip: session.ip,
      },
    });

    return { success: true, message: 'Session terminated successfully' };
  }

  // Admin Manual Account Linking
  async linkUserAccount(
    data: {
      userId: string;
      portalId: string;
      externalUserId: string;
      portalRole: string;
    },
    admin: User
  ) {
    const existing = await this.prisma.portalAccount.findFirst({
      where: { userId: data.userId, portalId: data.portalId },
    });

    let account;
    if (existing) {
      account = await this.prisma.portalAccount.update({
        where: { id: existing.id },
        data: {
          externalUserId: data.externalUserId,
          portalRole: data.portalRole,
          status: 'ACTIVE',
        },
      });
    } else {
      account = await this.prisma.portalAccount.create({
        data: {
          userId: data.userId,
          portalId: data.portalId,
          externalUserId: data.externalUserId,
          portalRole: data.portalRole,
          linkingMethod: 'SIGNED_TOKEN_HANDOFF',
          status: 'ACTIVE',
        },
      });
    }

    await this.auditService.logAction({
      actorId: admin.id,
      action: 'ADMIN_ACCOUNT_LINKED',
      entityType: 'PortalAccount',
      entityId: account.id,
      metadata: data,
    });

    return account;
  }

  // Query Users for Admin selection
  async getAllUsers(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        mobile: true,
        userType: true,
      },
      take: 20,
    });
  }
}
