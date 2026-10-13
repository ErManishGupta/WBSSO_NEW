import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';

describe('WB Labour Department SSO Platform (E2E Integration)', () => {
  let app: INestApplication;
  let applicantFactoryCookie: string;
  let applicantBothCookie: string;
  let factoryPortalId: string;
  let launchToken: string;
  let launchJti: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', {
      exclude: ['.well-known/jwks.json'],
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. JWKS Public Key Endpoint', () => {
    it('GET /.well-known/jwks.json should return standard RS256 JWKS keys', async () => {
      const res = await request(app.getHttpServer())
        .get('/.well-known/jwks.json')
        .expect(200);

      expect(res.body).toHaveProperty('keys');
      expect(Array.isArray(res.body.keys)).toBe(true);
      expect(res.body.keys.length).toBeGreaterThan(0);
      expect(res.body.keys[0].kty).toBe('RSA');
      expect(res.body.keys[0].use).toBe('sig');
      expect(res.body.keys[0].kid).toBe('wb-sso-key-2026');
    });
  });

  describe('2. Authentication & Entitlements', () => {
    it('POST /api/v1/auth/login should authenticate applicant_factory', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'applicant_factory',
          password: 'Pass@WB2026',
        })
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe('applicant_factory');
      expect(res.body.user.userType).toBe('APPLICANT');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      applicantFactoryCookie = cookies[0];
    });

    it('GET /api/v1/dashboard should return ONLY entitled portals for Applicant A (exactly 1 tile)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Cookie', applicantFactoryCookie)
        .expect(200);

      expect(res.body.portals.length).toBe(1);
      expect(res.body.portals[0].portal.slug).toBe('factory-portal');
      factoryPortalId = res.body.portals[0].portal.id;

      // Assert that Portal B and Portal C NEVER appear for this user
      const slugs = res.body.portals.map((p: any) => p.portal.slug);
      expect(slugs).not.toContain('labour-welfare-portal');
      expect(slugs).not.toContain('shops-establishments-portal');
    });

    it('POST /api/v1/auth/login should authenticate applicant_both', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'applicant_both',
          password: 'Pass@WB2026',
        })
        .expect(200);

      const cookies = res.headers['set-cookie'];
      applicantBothCookie = cookies[0];
    });

    it('GET /api/v1/dashboard should return exactly 2 tiles for Applicant B', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Cookie', applicantBothCookie)
        .expect(200);

      expect(res.body.portals.length).toBe(2);
      const slugs = res.body.portals.map((p: any) => p.portal.slug);
      expect(slugs).toContain('factory-portal');
      expect(slugs).toContain('labour-welfare-portal');
      expect(slugs).not.toContain('shops-establishments-portal');
    });
  });

  describe('3. SSO Launch & Anti-Replay Protection', () => {
    it('POST /api/v1/portals/:id/launch generates a 60-second single-use signed token', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/portals/${factoryPortalId}/launch`)
        .set('Cookie', applicantFactoryCookie)
        .expect(201);

      expect(res.body).toHaveProperty('launchUrl');
      expect(res.body.launchUrl).toContain('token=');

      const url = new URL(res.body.launchUrl);
      launchToken = url.searchParams.get('token')!;
      expect(launchToken).toBeDefined();

      // Decode payload to extract JTI for verify-handoff
      const parts = launchToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      launchJti = payload.jti;
      expect(payload.aud).toBe('factory-portal');
    });

    it('POST /api/v1/portals/verify-handoff consumes the token on first use', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/portals/verify-handoff')
        .send({
          jti: launchJti,
          portalSlug: 'factory-portal',
        })
        .expect(200);

      expect(res.body.valid).toBe(true);
    });

    it('POST /api/v1/portals/verify-handoff BLOCKS replay on second attempt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/portals/verify-handoff')
        .send({
          jti: launchJti,
          portalSlug: 'factory-portal',
        })
        .expect(401);

      expect(res.body.message).toContain('replay blocked');
    });
  });
});
