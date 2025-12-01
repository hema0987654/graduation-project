import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport'; 
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import type { Express } from 'express';
import { RolesGuard } from 'src/common/roles.guard';
import { Role } from 'src/common/role.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Role(UserRole.ADMIN)
  create(@Body() createCourseDto: CreateCourseDto, @Req() req) {
    const userId = req.user.id;
    return this.coursesService.create(createCourseDto, userId);
  }

  @Post(':courseId/chapters/upload')
  @Role(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadChapter(
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') chapterTitle: string,
    @Req() req,
  ) {
    const userId = req.user.id;
    console.log('Received file:', file);
    return this.coursesService.uploadChapterZip(
      courseId,
      chapterTitle,
      file,
      userId,
    );
  }

  @Post(':id/enroll')
  @Role(UserRole.STUDENT)
  async enroll(
    @Req() req
    ,
    @Param('id') courseId: string
  ) {
    const studentId = req.user.id;
    return this.coursesService.enrollStudent(courseId, studentId);
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Get(':id/students')
  async getEnrolledStudents(@Param('id') courseId: string) {
    return this.coursesService.getEnrolledStudents(courseId);
  }

  @Patch(':id')
  @Role(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Role(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
