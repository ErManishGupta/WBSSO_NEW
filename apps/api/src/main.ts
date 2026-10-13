import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
const cookieParser = require('cookie-parser');
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed per-page / allows Swagger & local dev
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Cookie Parser
  const parseCookies = typeof cookieParser === 'function' ? cookieParser : (cookieParser as any).default;
  app.use(parseCookies());

  // CORS Configuration
  const allowedOrigins = [
    process.env.WEB_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:4001',
    'http://localhost:4002',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4001',
    'http://127.0.0.1:4002',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev permissive for mock portals
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-session-id'],
  });

  // Global Rate Limiting on state-changing & auth endpoints
  const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: 'Too many requests. Please wait a moment.' },
  });
  app.use('/api/v1/auth', authLimiter);
  app.use('/api/v1/portals', authLimiter);

  // Global Prefix for API (exclude JWKS)
  app.setGlobalPrefix('api/v1', {
    exclude: ['.well-known/jwks.json', 'health'],
  });

  // OpenAPI (Swagger) Specification
  const config = new DocumentBuilder()
    .setTitle('West Bengal Labour Department - Unified SSO API')
    .setDescription(
      'Single Sign-On (SSO) Central Identity, Entitlement and Secure Token Launch API'
    )
    .setVersion('1.0.0')
    .addCookieAuth('wb_sso_session')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'WB Labour SSO API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 Central SSO API listening on http://localhost:${port}`);
  logger.log(`📚 Swagger OpenAPI documentation available at http://localhost:${port}/api/docs`);
  logger.log(`🔑 JWKS endpoint available at http://localhost:${port}/.well-known/jwks.json`);
}

bootstrap();
