import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
// cspell:ignore unzipper
import * as unzipper from 'unzipper';
import { Course } from './entities/course.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EmailService } from 'src/email/email.service';


@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly emailService:EmailService
  ) { }

  async create(createCourseDto: CreateCourseDto, userId: string) {
    const course = new this.courseModel({
      ...createCourseDto,
      ownerId: userId,
    });
    return course.save();
  }

  async uploadChapterZip(courseId: string, chapterTitle: string, file: Express.Multer.File, userId: string) {
    const course = await this.courseModel.findOne({ _id: courseId, ownerId: userId });
    if (!course) throw new Error("Course not found or access denied");

    const chapterId = new Types.ObjectId();
    const extractPath = path.join(process.cwd(), 'uploads', userId, 'courses', courseId.toString(), chapterId.toString());

    fs.mkdirSync(extractPath, { recursive: true });

    const tempZipPath = path.join(extractPath, file.originalname);
    fs.writeFileSync(tempZipPath, file.buffer);

    await fs.createReadStream(tempZipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    fs.unlinkSync(tempZipPath);

    const contentPath = `/uploads/${userId}/courses/${courseId}/${chapterId}/stroyline/story.html`;

    course.chapters.push({
      _id: chapterId,
      title: chapterTitle,
      contentPath,
      zipFileName: file.originalname,
      uploadedAt: new Date()
    });

    await course.save();

    return { success: true, chapterId, contentPath };
  }

  async findAll() {
    return await this.courseModel.find().populate('ownerId', 'name email').exec();
  }

  async findOne(id: string) {
    return await this.courseModel.findById(id).populate('ownerId', 'name email').exec();
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    return await this.courseModel.findByIdAndUpdate(id, updateCourseDto, { new: true });
  }

  async remove(id: string) {
    return await this.courseModel.findByIdAndDelete(id);
  }

  async enrollStudent(courseId: string, userId: string) {
    const course = await this.courseModel.findById(courseId);
    const user = await this.userModel.findById(userId);
  
    if (!course) throw new NotFoundException("Course not found");
    if (!user) throw new NotFoundException("User not found");
  
    const alreadyEnrolled = course.studentsEnrolled.some(
      (id) => id.toString() === userId,
    );
  
    if (alreadyEnrolled) {
      throw new BadRequestException("User is already enrolled in this course");
    }
  
    const updatedCourse = await this.courseModel.findByIdAndUpdate(
      courseId,
      { $addToSet: { studentsEnrolled: userId } },
      { new: true },
    );
  
    const subject = `Enrollment Confirmation for ${course.title}`;
    const message = `Hi ${user.name},\n\nYou have successfully enrolled in the course: ${course.title}.\n\nEnjoy learning!`;
  
      await this.emailService.sendGenericEmail(user.email, message, subject);
    
  
    return { message: "User enrolled and email sent", course: updatedCourse };
  }
  
  async getEnrolledStudents(courseId: string) {
    const course = await this.courseModel
      .findById(courseId)
      .populate('studentsEnrolled', 'name email avatar_url')
      .lean();
  
    if (!course) throw new NotFoundException("Course not found");
  
    return {
      courseId: course._id,
      totalStudents: course.studentsEnrolled?.length || 0,
      students: course.studentsEnrolled,
    };
  }
  
}
