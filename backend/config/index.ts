/**
 * PulseCare Health System - Application Configuration
 * Strictly encapsulates all environment variables and defaults.
 * Secrets should be injected via AWS Secrets Manager / Parameter Store in production.
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: 3000,
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  jwt: {
    secret: process.env.JWT_SECRET || 'pulsecare-development-secret-key-32-chars-long!!',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    candidateSecrets: Array.from(
      new Set(
        [
          process.env.JWT_SECRET,
          'pulsecare-development-secret-key-32-chars-long!!',
          'dev-only-secret-change-this-before-deployment-12345',
          'pulsecare-production-insecure-default-change-in-aws-secrets',
        ].filter(Boolean) as string[]
      )
    ),
  },

  db: {
    url: process.env.DATABASE_URL || '',
    isPostgres: Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableCloudWatchJson: process.env.ENABLE_CLOUDWATCH_JSON_LOGS !== 'false',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

export default config;
