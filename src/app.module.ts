import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from './configs/jwt.config';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { OtpModule } from './otp/otp.module';
import { RedisModule } from './redis/redis.module';
import { CoursesModule } from './courses/courses.module';
import { DashboardModule } from './dashboard/dashboard.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ jwtConfig]
    })
    ,MongooseModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => ({
      uri: configService.get('Mongo_DB'),
    }),
    inject: [ConfigService],
  }),UsersModule, AuthModule, EmailModule, OtpModule, RedisModule, CoursesModule, DashboardModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
