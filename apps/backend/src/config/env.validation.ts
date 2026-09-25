export type AppEnv = {
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  /** Comma-separated origins; empty = CORS disabled (server-to-server / curl only). */
  CORS_ORIGINS: string;
};

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const required = ['DATABASE_URL', 'REDIS_URL'] as const;
  for (const key of required) {
    if (!config[key] || String(config[key]).trim() === '') {
      throw new Error(`Missing required env: ${key}`);
    }
  }

  const portRaw = config.PORT ?? 3001;
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('PORT must be a positive number');
  }

  return {
    NODE_ENV: String(config.NODE_ENV ?? 'development'),
    PORT: port,
    API_PREFIX: String(config.API_PREFIX ?? 'api/v1'),
    DATABASE_URL: String(config.DATABASE_URL),
    REDIS_URL: String(config.REDIS_URL),
    APP_NAME: String(config.APP_NAME ?? 'sareee-backend'),
    APP_VERSION: String(config.APP_VERSION ?? '0.1.0'),
    CORS_ORIGINS: String(config.CORS_ORIGINS ?? ''),
  };
}
