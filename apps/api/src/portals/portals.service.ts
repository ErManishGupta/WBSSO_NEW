import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwksService } from '../jwks/jwks.service';
import { AuditService } from '../audit/audit.service';
import { User, UserType, LinkingMethod } from '@prisma/client';
import { importPKCS8, SignJWT } from 'jose';
import * as crypto from 'node:crypto';

@Injectable()
export class PortalsService {
  private readonly logger = new Logger(PortalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwksService: JwksService,
    private readonly auditService: AuditService
  ) {}

  async getLinkablePortals(user: User) {
    // Portals matching user's UserType that the user has NOT currently linked as ACTIVE
    const existingAccounts = await this.prisma.portalAccount.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      select: { portalId: true },
    });

    const activePortalIds = existingAccounts.map((a) => a.portalId);

    const portals = await this.prisma.portal.findMany({
      where: {
        status: 'ACTIVE',
        allowedUserTypes: { has: user.userType },
        id: { notIn: activePortalIds },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return portals;
  }

  async startLink(portalId: string, user: User) {
    const portal = await this.prisma.portal.findUnique({
      where: { id: portalId },
    });

    if (!portal || portal.status !== 'ACTIVE') {
      throw new NotFoundException('Portal not found or currently unavailable');
    }

    if (!portal.allowedUserTypes.includes(user.userType)) {
      throw new ForbiddenException('User type is not entitled to link this portal');
    }

    // Verify not already actively linked
    const existing = await this.prisma.portalAccount.findUnique({
      where: {
        userId_portalId: {
          userId: user.id,
          portalId: portal.id,
        },
      },
    });

    if (existing && existing.status === 'ACTIVE') {
      throw new BadRequestException('Portal is already linked to your account');
    }

    const challengeId = `link_${crypto.randomUUID()}`;

    // Return challenge and localized instructions based on portal linking method
    const instructions = {
      en:
        portal.linkingMethod === 'CONSENT_LINK'
          ? 'Enter your Department Registration Number / Mobile OTP to link existing account.'
          : 'Confirm consent to link existing enterprise credentials.',
      bn:
        portal.linkingMethod === 'CONSENT_LINK'
          ? 'বিদ্যমান অ্যাকাউন্ট সংযুক্ত করতে আপনার রেজিস্ট্রেশন নম্বর বা ওটিপি প্রদান করুন।'
          : 'বিদ্যমান এন্টারপ্রাইজ অ্যাকাউন্ট সংযুক্ত করতে সম্মতি নিশ্চিত করুন।',
    };

    return {
      portalId: portal.id,
      portalNameEn: portal.nameEn,
      portalNameBn: portal.nameBn,
      linkingMethod: portal.linkingMethod,
      challengeId,
      instructions,
    };
  }

  async confirmLink(
    portalId: string,
    user: User,
    data: { challengeId: string; externalUserId?: string; codeOrCredential?: string },
    ip = '127.0.0.1',
    userAgent = 'Browser'
  ) {
    const portal = await this.prisma.portal.findUnique({
      where: { id: portalId },
    });

    if (!portal || portal.status !== 'ACTIVE') {
      throw new NotFoundException('Portal not found');
    }

    const extId =
      data.externalUserId ||
      `EXT-${user.userType.substring(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`;

    const role =
      user.userType === 'OFFICER'
        ? 'Department Officer'
        : 'Authorized Registered Applicant';

    const account = await this.prisma.portalAccount.upsert({
      where: {
        userId_portalId: {
          userId: user.id,
          portalId: portal.id,
        },
      },
      update: {
        status: 'ACTIVE',
        externalUserId: extId,
        portalRole: role,
        linkingMethod: portal.linkingMethod,
        linkedAt: new Date(),
      },
      create: {
        userId: user.id,
        portalId: portal.id,
        externalUserId: extId,
        portalRole: role,
        status: 'ACTIVE',
        linkingMethod: portal.linkingMethod,
      },
      include: { portal: true },
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'PORTAL_LINK',
      entityType: 'PortalAccount',
      entityId: account.id,
      ip,
      userAgent,
      metadata: {
        portalId: portal.id,
        portalSlug: portal.slug,
        externalUserId: extId,
        method: portal.linkingMethod,
      },
    });

    return account;
  }

  async unlinkPortal(
    portalId: string,
    user: User,
    ip = '127.0.0.1',
    userAgent = 'Browser'
  ) {
    const account = await this.prisma.portalAccount.findUnique({
      where: {
        userId_portalId: {
          userId: user.id,
          portalId,
        },
      },
      include: { portal: true },
    });

    if (!account) {
      throw new NotFoundException('No linked account found for this portal');
    }

    await this.prisma.portalAccount.update({
      where: { id: account.id },
      data: { status: 'REVOKED' },
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'PORTAL_UNLINK',
      entityType: 'PortalAccount',
      entityId: account.id,
      ip,
      userAgent,
      metadata: {
        portalId: account.portalId,
        portalSlug: account.portal.slug,
      },
    });

    return { success: true, message: 'Portal unlinked successfully' };
  }

  async launchPortal(
    portalId: string,
    user: User,
    ip = '127.0.0.1',
    userAgent = 'Browser'
  ) {
    // 1. Strict entitlement verification
    const account = await this.prisma.portalAccount.findUnique({
      where: {
        userId_portalId: {
          userId: user.id,
          portalId,
        },
      },
      include: { portal: true },
    });

    if (!account || account.status !== 'ACTIVE') {
      throw new ForbiddenException('User is not actively entitled to launch this portal');
    }

    if (account.portal.status !== 'ACTIVE') {
      throw new ForbiddenException(`Portal is currently ${account.portal.status.toLowerCase()}`);
    }

    // 2. Generate single-use JTI and 60-second expiration
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60s validity

    await this.prisma.launchToken.create({
      data: {
        jti,
        userId: user.id,
        portalId: account.portal.id,
        expiresAt,
      },
    });

    // 3. Sign RS256 JWT
    const privateKey = await importPKCS8(this.jwksService.getPrivateKeyPem(), 'RS256');

    const token = await new SignJWT({
      sub: user.id,
      portal_user_id: account.externalUserId,
      portal_role: account.portalRole,
      aud: account.portal.slug,
      jti,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'wb-sso-key-2026' })
      .setIssuedAt()
      .setExpirationTime('60s')
      .sign(privateKey);

    // 4. Update lastLaunchedAt
    await this.prisma.portalAccount.update({
      where: { id: account.id },
      data: { lastLaunchedAt: new Date() },
    });

    // 5. Audit Log
    await this.auditService.logAction({
      actorId: user.id,
      action: 'PORTAL_LAUNCH',
      entityType: 'Portal',
      entityId: account.portal.id,
      ip,
      userAgent,
      metadata: {
        portalSlug: account.portal.slug,
        jti,
        externalUserId: account.externalUserId,
      },
    });

    const launchUrlWithToken = `${account.portal.launchUrl}?token=${encodeURIComponent(token)}`;

    return {
      launchUrl: launchUrlWithToken,
      expiresInSeconds: 60,
    };
  }

  async verifyHandoff(jti: string, portalSlug: string) {
    const launchToken = await this.prisma.launchToken.findUnique({
      where: { jti },
      include: { portal: true },
    });

    if (!launchToken) {
      throw new UnauthorizedException('Invalid launch token');
    }

    if (launchToken.portal.slug !== portalSlug) {
      throw new UnauthorizedException('Token audience mismatch');
    }

    if (launchToken.usedAt) {
      this.logger.warn(`Replay attack detected for launch token ${jti}`);
      throw new UnauthorizedException('Token has already been consumed (replay blocked)');
    }

    if (launchToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Launch token has expired');
    }

    // Mark as consumed
    await this.prisma.launchToken.update({
      where: { jti },
      data: { usedAt: new Date() },
    });

    return {
      valid: true,
      userId: launchToken.userId,
    };
  }
}
