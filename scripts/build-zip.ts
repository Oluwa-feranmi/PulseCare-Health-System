/**
 * PulseCare Health System - Offline Project ZIP Generator
 * Usage: npm run build:zip
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

async function generateProjectZip() {
  const outputPath = path.resolve(process.cwd(), 'pulsecare-health-system.zip');
  const output = fs.createWriteStream(outputPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  console.log(`[ZIP] Creating project archive at ${outputPath}...`);

  return new Promise<void>((resolve, reject) => {
    output.on('close', () => {
      console.log(`[ZIP] Archive generated successfully! (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
      resolve();
    });

    archive.on('error', (err: any) => reject(err));
    archive.pipe(output);

    archive.glob('**/*', {
      cwd: process.cwd(),
      ignore: [
        'node_modules/**',
        'dist/**',
        '.git/**',
        'pulsecare.sqlite',
        '*.zip',
      ],
      dot: true,
    });

    archive.finalize();
  });
}

generateProjectZip().catch((err) => {
  console.error('[ZIP] Failed:', err);
  process.exit(1);
});
