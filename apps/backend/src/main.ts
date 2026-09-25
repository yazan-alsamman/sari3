import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, raw, urlencoded, type NextFunction, type Request, type Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    bodyParser: false,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);
  const prefix = config.get<string>('API_PREFIX', 'api/v1');
  const appName = config.get<string>('APP_NAME', 'sareee-backend');
  const appVersion = config.get<string>('APP_VERSION', '0.1.0');

  // ADR-015 local adapter: raw PUT body for /media/:id/upload
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'PUT' && /\/media\/[^/]+\/upload/.test(req.url)) {
      return raw({ type: '*/*', limit: '5mb' })(req, res, next);
    }
    return next();
  });
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true }));

  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  const corsOrigins = config
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });
  }

  const swagger = new DocumentBuilder()
    .setTitle('Saree\'e Backend API')
    .setDescription(
      "Production API for Saree'e (سريع حوش بلاس). Phase 3 — zones & pricing.",
    )
    .setVersion(appVersion)
    .addTag('health')
    .addTag('auth')
    .addTag('media')
    .addTag('admin-drivers')
    .addTag('service-zones')
    .addTag('admin-zones')
    .addTag('pricing')
    .addTag('admin-pricing')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(
    `${appName} v${appVersion} listening on :${port}/${prefix} (swagger /docs)`,
  );
}

void bootstrap();
