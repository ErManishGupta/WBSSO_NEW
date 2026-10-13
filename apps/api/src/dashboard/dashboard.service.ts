import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(user: User) {
    // Strictly fetch ONLY ACTIVE portal accounts for this user
    const portalAccounts = await this.prisma.portalAccount.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        portal: {
          status: 'ACTIVE',
        },
      },
      include: {
        portal: true,
      },
      orderBy: {
        portal: {
          sortOrder: 'asc',
        },
      },
    });

    // Officer mock pending task count
    const portalsWithPending = portalAccounts.map((account) => {
      let pendingCount = 0;
      if (user.userType === 'OFFICER') {
        if (account.portal.slug === 'factory-portal') pendingCount = 12;
        else if (account.portal.slug === 'labour-welfare-portal') pendingCount = 5;
      }
      return {
        ...account,
        pendingCount,
      };
    });

    const pendingActions = portalsWithPending.reduce(
      (acc, curr) => acc + (curr.pendingCount || 0),
      0
    );

    const { passwordHash, failedLogins, lockedUntil, ...safeUser } = user;

    return {
      user: safeUser,
      portals: portalsWithPending,
      stats: {
        totalLinked: portalAccounts.length,
        pendingActions,
      },
    };
  }
}
