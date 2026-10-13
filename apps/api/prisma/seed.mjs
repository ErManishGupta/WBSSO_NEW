import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding West Bengal Labour Department SSO Database...');

  // 1. Hash passwords
  const adminPasswordHash = await argon2.hash('Admin@WB2026');
  const userPasswordHash = await argon2.hash('Pass@WB2026');

  // Clean existing tables (in foreign-key safe order)
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.launchToken.deleteMany({});
  await prisma.portalAccount.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.portal.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Seed Users
  const admin = await prisma.user.create({
    data: {
      username: 'admin_wb',
      passwordHash: adminPasswordHash,
      name: 'Sri Subrata Roy (System Admin)',
      email: 'admin.labour@wb.gov.in.fake',
      mobile: '9830000001',
      userType: 'ADMIN',
      preferredLanguage: 'en',
    },
  });

  const applicantFactory = await prisma.user.create({
    data: {
      username: 'applicant_factory',
      passwordHash: userPasswordHash,
      name: 'Ananya Banerjee',
      email: 'ananya.factory@example.com',
      mobile: '9830000002',
      userType: 'APPLICANT',
      preferredLanguage: 'en',
    },
  });

  const applicantBoth = await prisma.user.create({
    data: {
      username: 'applicant_both',
      passwordHash: userPasswordHash,
      name: 'Debashis Mukherjee',
      email: 'debashis.mukherjee@example.com',
      mobile: '9830000003',
      userType: 'APPLICANT',
      preferredLanguage: 'bn',
    },
  });

  const officerFactory = await prisma.user.create({
    data: {
      username: 'officer_factory',
      passwordHash: userPasswordHash,
      name: 'Joydeb Sen (Inspector of Factories)',
      email: 'joydeb.sen@wb.gov.in.fake',
      mobile: '9830000004',
      userType: 'OFFICER',
      preferredLanguage: 'en',
    },
  });

  const officerGeneral = await prisma.user.create({
    data: {
      username: 'officer_general',
      passwordHash: userPasswordHash,
      name: 'Mousumi Chakraborty (Welfare Officer)',
      email: 'mousumi.c@wb.gov.in.fake',
      mobile: '9830000005',
      userType: 'OFFICER',
      preferredLanguage: 'bn',
    },
  });

  // 3. Seed Portals
  const portalFactory = await prisma.portal.create({
    data: {
      slug: 'factory-portal',
      nameEn: 'WB Directorate of Factories Portal',
      nameBn: 'পশ্চিমবঙ্গ কারখানা অধিকার পোর্টাল',
      descriptionEn: 'Factory licensing, plan approvals, and statutory safety filings',
      descriptionBn: 'কারখানা লাইসেন্সিং, পরিকল্পনা অনুমোদন এবং সংবিধিবদ্ধ সুরক্ষা ফাইলিং',
      iconKey: 'Factory',
      baseUrl: 'http://localhost:4001',
      launchUrl: 'http://localhost:4001/sso/callback',
      linkingMethod: 'SIGNED_TOKEN_HANDOFF',
      status: 'ACTIVE',
      allowedUserTypes: ['APPLICANT', 'OFFICER'],
      sortOrder: 1,
    },
  });

  const portalB = await prisma.portal.create({
    data: {
      slug: 'labour-welfare-portal',
      nameEn: 'WB BOCW Welfare Board Portal',
      nameBn: 'পশ্চিমবঙ্গ ভবন ও অন্যান্য নির্মাণ কর্মী কল্যাণ পর্ষদ',
      descriptionEn: 'Construction worker registration, cess collection, and welfare benefits',
      descriptionBn: 'নির্মাণ কর্মী নিবন্ধন, সেস সংগ্রহ এবং কল্যাণ অনুদান',
      iconKey: 'HeartHandshake',
      baseUrl: 'http://localhost:4002',
      launchUrl: 'http://localhost:4002/sso/callback',
      linkingMethod: 'CONSENT_LINK',
      status: 'ACTIVE',
      allowedUserTypes: ['APPLICANT', 'OFFICER'],
      sortOrder: 2,
    },
  });

  const portalC = await prisma.portal.create({
    data: {
      slug: 'shops-establishments-portal',
      nameEn: 'WB Shops & Commercial Establishments Portal',
      nameBn: 'পশ্চিমবঙ্গ দোকান ও বাণিজ্যিক প্রতিষ্ঠান পোর্টাল',
      descriptionEn: 'Shops registration certificate, annual renewals, and trade inspections',
      descriptionBn: 'দোকান নিবন্ধন শংসাপত্র, বার্ষিক পুনর্নবীকরণ এবং বাণিজ্য পরিদর্শন',
      iconKey: 'Store',
      baseUrl: 'http://localhost:4003',
      launchUrl: 'http://localhost:4003/sso/callback',
      linkingMethod: 'CONSENT_LINK',
      status: 'ACTIVE',
      allowedUserTypes: ['APPLICANT', 'OFFICER'],
      sortOrder: 3,
    },
  });

  // 4. Seed Portal Accounts (Entitlements)
  // applicantFactory -> Only Factory
  await prisma.portalAccount.create({
    data: {
      userId: applicantFactory.id,
      portalId: portalFactory.id,
      externalUserId: 'FAC-LIC-77012',
      portalRole: 'Factory Occupier (Licence Holder)',
      status: 'ACTIVE',
      linkingMethod: 'SIGNED_TOKEN_HANDOFF',
    },
  });

  // applicantBoth -> Factory + Portal B
  await prisma.portalAccount.create({
    data: {
      userId: applicantBoth.id,
      portalId: portalFactory.id,
      externalUserId: 'FAC-MGR-99120',
      portalRole: 'Authorized Factory Manager',
      status: 'ACTIVE',
      linkingMethod: 'SIGNED_TOKEN_HANDOFF',
    },
  });

  await prisma.portalAccount.create({
    data: {
      userId: applicantBoth.id,
      portalId: portalB.id,
      externalUserId: 'BOCW-EST-44021',
      portalRole: 'Registered Contractor / Employer',
      status: 'ACTIVE',
      linkingMethod: 'CONSENT_LINK',
    },
  });

  // officerFactory -> Factory Portal
  await prisma.portalAccount.create({
    data: {
      userId: officerFactory.id,
      portalId: portalFactory.id,
      externalUserId: 'INSP-FAC-014',
      portalRole: 'Senior Inspector of Factories',
      status: 'ACTIVE',
      linkingMethod: 'SIGNED_TOKEN_HANDOFF',
    },
  });

  // officerGeneral -> Portal B
  await prisma.portalAccount.create({
    data: {
      userId: officerGeneral.id,
      portalId: portalB.id,
      externalUserId: 'WEL-OFF-088',
      portalRole: 'District Welfare Officer',
      status: 'ACTIVE',
      linkingMethod: 'CONSENT_LINK',
    },
  });

  // Note: Portal C has ZERO linked accounts to prove strict entitlement filtering!

  // 5. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: applicantFactory.id,
        portalId: portalFactory.id,
        titleEn: 'Factory License Renewal Reminder',
        titleBn: 'কারখানা লাইসেন্স পুনর্নবীকরণ অনুস্মারক',
        bodyEn: 'Your annual license for unit WB-FAC-401 expires in 30 days. Please file Form 2.',
        bodyBn: 'আপনার ইউনিট WB-FAC-401-এর বার্ষিক লাইসেন্সের মেয়াদ ৩০ দিনের মধ্যে শেষ হবে। ফর্ম ২ জমা দিন।',
        level: 'ACTION',
      },
      {
        userId: applicantBoth.id,
        portalId: portalB.id,
        titleEn: 'BOCW Cess Assessment Notice',
        titleBn: 'নির্মাণ সেস মূল্যায়ন বিজ্ঞপ্তি',
        bodyEn: 'Quarterly cess declaration for project Metro-Line-3 has been recorded.',
        bodyBn: 'মেট্রো লাইন ৩ প্রকল্পের ত্রৈমাসিক সেস ঘোষণা সফলভাবে নথিভুক্ত হয়েছে।',
        level: 'INFO',
      },
      {
        userId: officerFactory.id,
        portalId: portalFactory.id,
        titleEn: 'Pending Inspection Reports (12)',
        titleBn: 'অপেক্ষারত পরিদর্শন রিপোর্ট (১২)',
        bodyEn: '12 new factory approval dossiers are assigned to your jurisdiction.',
        bodyBn: 'আপনার এখতিয়ারে ১২টি নতুন কারখানা অনুমোদন সংক্রান্ত ফাইল পর্যালোচনার অপেক্ষায় রয়েছে।',
        level: 'WARNING',
      },
    ],
  });

  console.log('\n======================================================');
  console.log('✅ DATABASE SEED COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
  console.log('SEEDED TEST ACCOUNTS (ALL ON LOCAL ENVIRONMENT):');
  console.log('------------------------------------------------------');
  console.log('1. Admin:');
  console.log('   Username: admin_wb');
  console.log('   Password: Admin@WB2026');
  console.log('   Mobile:   9830000001');
  console.log('------------------------------------------------------');
  console.log('2. Applicant A (Only Factory Portal):');
  console.log('   Username: applicant_factory');
  console.log('   Password: Pass@WB2026');
  console.log('   Mobile:   9830000002');
  console.log('   Access:   [Factory Portal]');
  console.log('------------------------------------------------------');
  console.log('3. Applicant B (Factory Portal + Portal B):');
  console.log('   Username: applicant_both');
  console.log('   Password: Pass@WB2026');
  console.log('   Mobile:   9830000003');
  console.log('   Access:   [Factory Portal, Labour Welfare Portal B]');
  console.log('------------------------------------------------------');
  console.log('4. Officer 1 (Factory Inspector):');
  console.log('   Username: officer_factory');
  console.log('   Password: Pass@WB2026');
  console.log('   Mobile:   9830000004');
  console.log('------------------------------------------------------');
  console.log('5. Officer 2 (Labour Welfare Officer):');
  console.log('   Username: officer_general');
  console.log('   Password: Pass@WB2026');
  console.log('   Mobile:   9830000005');
  console.log('------------------------------------------------------');
  console.log('Dev Mock OTP Code (if OTP chosen): 123456');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
