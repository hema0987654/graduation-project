import { Module } from '@nestjs/common';
import { UsersModule } from "src/users/users.module";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Course, CourseSchema } from "./entities/course.entity";
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    {
      provide: 'UPLOAD_PATH',
      useValue: './uploads', 
    },
  ],
})
export class CoursesModule {}
