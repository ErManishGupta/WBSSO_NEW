import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { importSPKI, exportJWK, JWK } from 'jose';

@Injectable()
export class JwksService implements OnModuleInit {
  private readonly logger = new Logger(JwksService.name);
  private jwk!: JWK;
  private publicKeyPem!: string;
  private privateKeyPem!: string;

  async onModuleInit() {
    const keysDir = path.resolve(__dirname, '../../keys');
    const pubPath = path.join(keysDir, 'public.pem');
    const privPath = path.join(keysDir, 'private.pem');

    if (!fs.existsSync(pubPath) || !fs.existsSync(privPath)) {
      this.logger.error(`RSA keys not found at ${keysDir}`);
      throw new Error(`RSA keys missing at ${keysDir}`);
    }

    this.publicKeyPem = fs.readFileSync(pubPath, 'utf8');
    this.privateKeyPem = fs.readFileSync(privPath, 'utf8');

    const imported = await importSPKI(this.publicKeyPem, 'RS256');
    this.jwk = await exportJWK(imported);
    this.jwk.kid = 'wb-sso-key-2026';
    this.jwk.use = 'sig';
    this.jwk.alg = 'RS256';

    this.logger.log('JWKS Service initialized with kid: wb-sso-key-2026');
  }

  getJwks() {
    return {
      keys: [this.jwk],
    };
  }

  getPrivateKeyPem() {
    return this.privateKeyPem;
  }

  getPublicKeyPem() {
    return this.publicKeyPem;
  }
}
