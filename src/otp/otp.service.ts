import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from 'src/users/users.service';
import { OtpDocument, UserOtp } from './entity/otp.entity';
import { Model } from 'mongoose';
import { EmailService } from 'src/email/email.service';
import { AuthService } from 'src/auth/auth.service';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { addMinutes } from 'date-fns';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(UserOtp.name) private readonly otpModel: Model<OtpDocument>,
    private readonly emailService: EmailService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis
  ) { }

  async sendEmail(info: CreateUserDto) {
    await this.otpModel.deleteOne({ email: info.email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = addMinutes(new Date(), 5);

    const userOtp = new this.otpModel({
      name: info.name,
      email: info.email,
      password: info.password,
      role: info.role,
      avatar_url: info.avatar_url,
      otp: otpHash,
      expiresAt,
    });
    await userOtp.save();

    await this.redis.set(`otp:${info.email}`, otpHash, 'EX', 300);

    const message = `🔐 Your OTP Code: ${otp}\n⏳ This code is valid for 5 minutes.`;
    await this.emailService.sendGenericEmail(info.email, message,'Your OTP Code');

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const otpRecord = await this.otpModel.findOne({ email }).select('+password');;
    if (!otpRecord) {
      throw new HttpException('OTP not found', HttpStatus.NOT_FOUND);
    }

    if (otpRecord.expiresAt < new Date()) {
      await this.otpModel.deleteOne({ email });
      throw new HttpException('OTP expired', HttpStatus.BAD_REQUEST);
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }
    const user = await this.authService.register({
      name: otpRecord.name,
      email: otpRecord.email,
      password: otpRecord.password,
      role: otpRecord.role,
      avatar_url: otpRecord.avatar_url
    })

    await this.otpModel.deleteOne({ email });
    await this.redis.del(`otp:${email}`);


    return { message: 'OTP verified successfully', user };
  }
}
