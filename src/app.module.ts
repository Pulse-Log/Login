import { MailerModule } from '@nestjs-modules/mailer';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as cors from 'cors';
import helmet from 'helmet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // Make ConfigModule global
    }),
    AuthModule,
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mongodb' as const,
        url: configService.get<string>('DATABASE_URL'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DATABASE_SYNC'),
        logging: configService.get<boolean>('DATABASE_LOGGING'),
        ssl: configService.get<boolean>('DATABASE_SSL'),
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAILER_HOST'),
          port: configService.get<number>('MAILER_PORT'),
          auth: {
            user: configService.get<string>('MAILER_USER'),
            pass: configService.get<string>('MAILER_PASS'),
          },  
        },
        defaults: {
          from: configService.get<string>('MAILER_DEFAULT_FROM'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    // Enable CORS with custom options
    const corsOptions = {
      origin: this.configService.get<string>('CORS_ORIGIN'),
      methods: this.configService.get<string>('CORS_METHODS'),
      credentials: this.configService.get<boolean>('CORS_CREDENTIALS'),
    };

    consumer.apply(cors(corsOptions)).forRoutes('*');
    consumer.apply(helmet()).forRoutes('*');
  }
}
