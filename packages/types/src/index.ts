export type UserType = 'APPLICANT' | 'OFFICER' | 'ADMIN';

export type PortalStatus = 'ACTIVE' | 'MAINTENANCE' | 'DISABLED';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

export type LinkingMethod = 'OIDC_FEDERATION' | 'SIGNED_TOKEN_HANDOFF' | 'CONSENT_LINK';

export type NotificationLevel = 'INFO' | 'ACTION' | 'WARNING';

export interface SafeUser {
  id: string;
  username: string;
  name: string;
  email: string;
  mobile: string;
  userType: UserType;
  preferredLanguage: string;
  createdAt: string;
}

export interface SessionDto {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isCurrent?: boolean;
}

export interface PortalDto {
  id: string;
  slug: string;
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
}

export interface PortalAccountDto {
  id: string;
  userId: string;
  portalId: string;
  externalUserId: string;
  portalRole: string;
  status: AccountStatus;
  linkedAt: string;
  lastLaunchedAt: string | null;
  linkingMethod: LinkingMethod;
  portal: PortalDto;
  pendingCount?: number;
}

export interface DashboardResponse {
  user: SafeUser;
  portals: PortalAccountDto[];
  stats: {
    totalLinked: number;
    pendingActions: number;
  };
}

export interface LaunchTokenPayload {
  sub: string;
  portal_user_id: string;
  portal_role: string;
  aud: string;
  jti: string;
  exp: number;
  iat: number;
}

export interface NotificationDto {
  id: string;
  userId: string;
  portalId?: string | null;
  portal?: PortalDto | null;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  level: NotificationLevel;
  readAt: string | null;
  createdAt: string;
}

export interface AuditLogDto {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  ip: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor?: {
    username: string;
    name: string;
    userType: UserType;
  };
}

export interface LoginRequestDto {
  identifier: string; // username or mobile
  password?: string;
  useOtp?: boolean;
}

export interface OtpVerifyRequestDto {
  identifier: string;
  code: string;
}

export interface LinkStartRequestDto {
  portalId: string;
}

export interface LinkStartResponseDto {
  portalId: string;
  linkingMethod: LinkingMethod;
  challengeId: string;
  instructions: {
    en: string;
    bn: string;
  };
}

export interface LinkConfirmRequestDto {
  challengeId: string;
  codeOrCredential?: string;
  externalUserId?: string;
}
