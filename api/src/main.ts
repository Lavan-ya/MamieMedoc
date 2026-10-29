import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './prescriptions/prescriptions.service';

async function bootstrap() {
  // Load api/.env (ANTHROPIC_API_KEY, ...) into process.env.
  try {
    process.loadEnvFile();
  } catch {
    // No .env file: rely on the real environment.
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: 'http://localhost:3000' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Scanned prescriptions, shown next to the review list.
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads/' });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
