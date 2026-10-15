/**
 * PulseCare Health System - Main Server Entry Point
 * Full-stack Express.js server integrating the REST API with Vite frontend.
 * Production-ready for AWS ECS/Fargate container deployment behind an ALB.
 */

import express from 'express';
import path from 'path';
import config from './backend/config/index.js';
import db from './database/db.js';
import { runSeeds } from './database/seed.js';

// Middleware imports
import { cloudWatchRequestLogger } from './backend/middleware/logger.middleware.js';
import { errorHandler } from './backend/middleware/error.middleware.js';

// Route imports
import authRoutes from './backend/routes/auth.routes.js';
import patientRoutes from './backend/routes/patient.routes.js';
import appointmentRoutes from './backend/routes/appointment.routes.js';
import prescriptionRoutes from './backend/routes/prescription.routes.js';
import clinicalNotesRoutes from './backend/routes/clinicalNotes.routes.js';
import messageRoutes from './backend/routes/message.routes.js';
import auditRoutes from './backend/routes/audit.routes.js';
import healthRoutes from './backend/routes/health.routes.js';
import exportRoutes from './backend/routes/export.routes.js';

async function startServer() {
  const app = express();
  const PORT = config.port; // 3000

  // 1. Ensure database is initialized & seeded on startup
  try {
    await db.initialize();
    await runSeeds();
  } catch (err: any) {
    console.error('[SERVER] Database bootstrap failed:', err);
  }

  // 2. Core Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.cors.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // CloudWatch structured JSON request logging & metrics
  app.use(cloudWatchRequestLogger);

  // 3. Mount Health Probes FIRST (for AWS ALB rapid health checks)
  app.use(healthRoutes);

  // 4. Mount REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/prescriptions', prescriptionRoutes);
  app.use('/api/clinical-notes', clinicalNotesRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/export', exportRoutes);

  // 5. Global API Error Handler
  app.use('/api', errorHandler);

  // 6. Vite Frontend Integration (SPA fallback)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 7. Start Listening
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`PulseCare Health System API Server running on port ${PORT}`);
    console.log(`Environment: ${config.env}`);
    console.log(`Liveness Probe: http://localhost:${PORT}/health`);
    console.log(`Readiness Probe: http://localhost:${PORT}/health/ready`);
    console.log(`Metrics Endpoint: http://localhost:${PORT}/api/metrics`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[FATAL] Failed to start server:', err);
  process.exit(1);
});
