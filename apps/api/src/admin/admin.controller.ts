import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User, AccountStatus, PortalStatus, UserType, LinkingMethod } from '@prisma/client';

class CreatePortalDto {
  slug!: string;
  nameEn!: string;
  nameBn!: string;
  descriptionEn!: string;
  descriptionBn!: string;
  iconKey!: string;
  baseUrl!: string;
  launchUrl!: string;
  linkingMethod?: LinkingMethod;
  status?: PortalStatus;
  allowedUserTypes!: UserType[];
  sortOrder?: number;
}

class UpdatePortalDto {
  nameEn?: string;
  nameBn?: string;
  descriptionEn?: string;
  descriptionBn?: string;
  iconKey?: string;
  baseUrl?: string;
  launchUrl?: string;
  linkingMethod?: LinkingMethod;
  status?: PortalStatus;
  allowedUserTypes?: UserType[];
  sortOrder?: number;
}

class UpdateAccountStatusDto {
  status!: AccountStatus;
}

@ApiTags('Admin Console')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('portals')
  @ApiOperation({ summary: 'Admin: Get all portals including configuration' })
  async getPortals() {
    return await this.adminService.getPortals();
  }

  @Post('portals')
  @ApiOperation({ summary: 'Admin: Register new department portal' })
  async createPortal(@Body() body: CreatePortalDto, @CurrentUser() admin: User) {
    return await this.adminService.createPortal(body, admin);
  }

  @Put('portals/:id')
  @ApiOperation({ summary: 'Admin: Update portal configuration' })
  async updatePortal(
    @Param('id') id: string,
    @Body() body: UpdatePortalDto,
    @CurrentUser() admin: User
  ) {
    return await this.adminService.updatePortal(id, body, admin);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Admin: List user portal accounts and entitlements' })
  async getAccounts(
    @Query('search') search?: string,
    @Query('status') status?: AccountStatus,
    @Query('portalId') portalId?: string
  ) {
    return await this.adminService.getAccounts({ search, status, portalId });
  }

  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Admin: Suspend, revoke, or reactivate user portal mapping' })
  async updateAccountStatus(
    @Param('id') accountId: string,
    @Body() body: UpdateAccountStatusDto,
    @CurrentUser() admin: User
  ) {
    return await this.adminService.updateAccountStatus(accountId, body.status, admin);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Admin: Query security audit log with filters' })
  async getAudit(
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
    @Query('entityType') entityType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return await this.adminService.getAuditLogs({
      action,
      actorId,
      entityType,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('audit/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="sso_audit_logs.csv"')
  @ApiOperation({ summary: 'Admin: Export audit log entries as CSV file' })
  async exportAudit() {
    return await this.adminService.exportAuditCsv();
  }
}
