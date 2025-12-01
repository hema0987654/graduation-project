import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  collection: 'courses',
  timestamps: true,
})
export class Chapter {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  contentPath?: string;       // المسار بعد فك ZIP على السيرفر

  @Prop()
  zipFileName?: string;       // اسم ملف ZIP الأصلي (اختياري)

  @Prop()
  uploadedAt?: Date;          // وقت رفع المحتوى
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);



@Schema({
  collection: 'courses',
  timestamps: true,
})
export class Course extends Document {
  @Prop({ required: true })
  title: string; 

  @Prop()
  description?: string; 

  @Prop({ type: [ChapterSchema], default: [] })
  chapters: Chapter[]; 

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  studentsEnrolled: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;   
}

export const CourseSchema = SchemaFactory.createForClass(Course);
