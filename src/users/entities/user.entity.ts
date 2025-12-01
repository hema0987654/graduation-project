import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
  TEACHER = 'teacher',
}
export type userDocument = User & Document;
@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true })
  name: string;
  
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({select:false})
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: number;

  @Prop({ index: true, required: true, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Prop({ required: false })
  avatar_url: string;
}
export const UserSchema = SchemaFactory.createForClass(User);