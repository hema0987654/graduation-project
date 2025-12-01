import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from 'src/users/entities/user.entity';

export type OtpDocument = UserOtp & Document;

@Schema({
  collection: 'user_otps',
  timestamps: true,
})
export class UserOtp {

  @Prop({ required: true })
  name: string;
  @Prop({ required: true, unique: true })
  email: string;
  @Prop({ required: true, select: false })
  password: string;

  @Prop({ index: true, required: true, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;
  @Prop({ required: false })
  avatar_url: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(UserOtp);
