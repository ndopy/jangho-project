import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TidesModule } from './tides/tides.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { AccommodationsModule } from './accommodations/accommodations.module';
import { NoticesModule } from './notices/notices.module';

@Module({
  imports: [
    // 1. ConfigModule 설정 : 애플리케이션 전체에서 .env 값을 사용할 수 있게 한다.
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 2. 비동기 TypeORM 설정 : ConfigService 를 주입받아 환경 변수를 안전하게 꺼낸다.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true, // 개발 환경에서만 true
      }),
    }),
    UsersModule,
    TidesModule,
    ExperiencesModule,
    AccommodationsModule,
    NoticesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
