import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('===========================================================');
console.log('🚀 Running Setup for WB Labour Department SSO Dashboard...');
console.log('===========================================================\n');

// 1. Handle .env creation
const rootEnvPath = path.join(rootDir, '.env');
const rootEnvExamplePath = path.join(rootDir, '.env.example');
const apiEnvPath = path.join(rootDir, 'apps/api/.env');

if (!fs.existsSync(rootEnvPath)) {
  console.log('📄 Copying .env.example to root .env...');
  fs.copyFileSync(rootEnvExamplePath, rootEnvPath);
} else {
  console.log('ℹ️  Root .env already exists.');
}

if (!fs.existsSync(apiEnvPath)) {
  console.log('📄 Copying root .env to apps/api/.env...');
  fs.copyFileSync(rootEnvPath, apiEnvPath);
}

// 2. Generate RSA Keypair
console.log('\n🔑 Ensuring RS256 RSA Keys exist...');
execSync('node scripts/generate-keys.mjs', { cwd: rootDir, stdio: 'inherit' });

// 3. Install dependencies across workspaces
console.log('\n📦 Installing dependencies for all workspaces...');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
execSync(`${npmCmd} install`, { cwd: rootDir, stdio: 'inherit' });

// 4. Build packages
console.log('\n🔨 Building shared packages (@wb-sso/types, @wb-sso/ui)...');
try {
  execSync(`${npmCmd} run build --workspace=@wb-sso/types`, { cwd: rootDir, stdio: 'inherit' });
  execSync(`${npmCmd} run build --workspace=@wb-sso/ui`, { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  console.warn('Note: Types/UI build will compile during dev if dependencies resolve directly.');
}

// 5. Generate Prisma Client & Push DB schema
console.log('\n🗄️  Generating Prisma Client & syncing PostgreSQL schema...');
execSync(`npx prisma generate --schema=./apps/api/prisma/schema.prisma`, { cwd: rootDir, stdio: 'inherit' });
execSync(`npx prisma db push --schema=./apps/api/prisma/schema.prisma --accept-data-loss`, { cwd: rootDir, stdio: 'inherit' });

// 6. Seed Database
console.log('\n🌱 Seeding database with test users and portals...');
execSync(`node apps/api/prisma/seed.mjs`, { cwd: rootDir, stdio: 'inherit' });

console.log('\n🎉 Setup completed successfully!');
console.log('👉 Run "npm run dev" to launch all services together.\n');
