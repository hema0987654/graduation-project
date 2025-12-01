import { Module, forwardRef } from '@nestjs/common';
import { OtpService } from './otp.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpSchema, UserOtp } from './entity/otp.entity';
import { UsersModule } from 'src/users/users.module';
import { EmailModule } from 'src/email/email.module';
import { AuthModule } from 'src/auth/auth.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserOtp.name, schema: OtpSchema }]),
    EmailModule,
    forwardRef(() => AuthModule),
    UsersModule,
    RedisModule
  ],
  providers: [OtpService],
  exports: [OtpService]
})
export class OtpModule {}
