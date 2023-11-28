import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirestoreModule } from './firestore/firestore.module';
import { HttpModule } from '@nestjs/axios';
import { AssetsModule } from './assets/assets.module';
import { StabilityModule } from './stability/stability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    FirestoreModule.forRoot({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        keyFilename: configService.get<string>('FIREBASE_KEY_PATH'),
      }),
      inject: [ConfigService],
    }),
    HttpModule,
    AssetsModule,
    StabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
