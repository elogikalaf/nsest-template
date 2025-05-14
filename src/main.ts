import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  // enable valideation pipes for dto validation
  app.useGlobalPipes(new ValidationPipe());

  // get version from env files which gets it from package.json
  const version = process.env.npm_package_version;

  // set the limit for the body size
  app.use(bodyParser.json({ limit: '10mb' }));


  // configure swagger
  const config = new DocumentBuilder()
    .setTitle('Richmond')
    .setDescription('The richmond API description')
    .setVersion(version)
    .addTag('richmond')
    .addBearerAuth()
    .addServer(`http://localhost:${process.env.PORT || 3000}`, 'localhost')
    .addServer(
      `http://108.165.228.125:${process.env.PORT || 3000}`,
      'Dev Server',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);


  await app.listen(3000);
}
bootstrap();
