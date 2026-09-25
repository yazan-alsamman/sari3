export type AppEnv = {
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  /** Comma-separated origins; empty = CORS disabled. */
  CORS_ORIGINS: string;
  JWT_ACCESS_SECRET: string;
  BOOTSTRAP_ADMIN_SECRET: string;
  MEDIA_LOCAL_ROOT: string;
};

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_ACCESS_SECRET'] as const;
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

  const jwt = String(config.JWT_ACCESS_SECRET);
  if (jwt.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
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
    JWT_ACCESS_SECRET: jwt,
    BOOTSTRAP_ADMIN_SECRET: String(config.BOOTSTRAP_ADMIN_SECRET ?? ''),
    MEDIA_LOCAL_ROOT: String(config.MEDIA_LOCAL_ROOT ?? ''),
  };
}
