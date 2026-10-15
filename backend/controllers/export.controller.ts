/**
 * PulseCare Health System - Project ZIP Export Controller
 * Generates and streams a complete clean ZIP archive of the entire application
 * for offline inspection, local Docker running, and IDE exploration.
 */

import { Request, Response } from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');
import path from 'path';

export class ExportController {
  public static async downloadZip(req: Request, res: Response): Promise<void> {
    const archive = new ZipArchive({
      zlib: { level: 9 }, // Maximum compression
    });

    res.attachment('pulsecare-health-system.zip');
    res.setHeader('Content-Type', 'application/zip');

    archive.on('error', (err: any) => {
      console.error('[EXPORT] Zip creation error:', err);
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    const rootDir = process.cwd();

    // Include all project files, ignoring build artifacts and sensitive local files
    archive.glob('**/*', {
      cwd: rootDir,
      ignore: [
        'node_modules/**',
        'dist/**',
        '.git/**',
        'pulsecare.sqlite',
        '*.zip',
        '.DS_Store',
      ],
      dot: true,
    });

    await archive.finalize();
  }
}

export default ExportController;
