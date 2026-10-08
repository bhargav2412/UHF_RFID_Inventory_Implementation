import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as moment from 'moment-timezone';

async function bootstrap() {
  moment.tz.setDefault('Asia/Kolkata');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { });
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new GlobalExceptionFilter());

  //temp image upload
  const uploadDir = join(process.cwd(), 'uploads', 'temp');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
