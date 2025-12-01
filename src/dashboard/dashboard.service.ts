import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // جلب كل الكورسات مع الشابترز واسم صاحب الكورس
  async getCoursesWithChapters() {
    return this.courseModel
      .find()
      .populate('ownerId', 'name email')
      .lean();
  }

  // إحصائيات عامة للـ Dashboard
  async getDashboardStats() {
    const totalCourses = await this.courseModel.countDocuments();
    const totalStudents = await this.userModel.countDocuments();
    const totalEnrollments = await this.courseModel.aggregate([
      { $project: { count: { $size: "$studentsEnrolled" } } },
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);
    return {
      totalCourses,
      totalStudents,
      totalEnrollments: totalEnrollments[0]?.total || 0,
    };
  }

  // أحدث الكورسات
  async getLatestCourses(limit = 5) {
    return this.courseModel.find().sort({ createdAt: -1 }).limit(limit);
  }

  // أحدث الشابترز عبر كل الكورسات
  async getLatestChapters(limit = 5) {
    const courses = await this.courseModel.find().lean();
    let chapters = courses.flatMap(c => c.chapters.map(ch => ({
      ...ch,
      courseTitle: c.title,
      courseId: c._id
    })));
    chapters.sort((a, b) => {
      if (!a.uploadedAt) return 1;
      if (!b.uploadedAt) return -1;
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
        return chapters.slice(0, limit);
  }

  // جلب المستخدمين مع فلتر اختياري
  async getUsers(filter?: any) {
    return this.userModel.find(filter || {}).sort({ createdAt: -1 });
  }

  // الكورسات الأكثر شعبية (عدد الطلاب)
  async getPopularCourses(limit = 5) {
    return this.courseModel.aggregate([
      { $project: { title: 1, studentsCount: { $size: "$studentsEnrolled" } } },
      { $sort: { studentsCount: -1 } },
      { $limit: limit }
    ]);
  }

  // بحث في الكورسات
  async searchCourses(query: string) {
    return this.courseModel.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ]
    })
      .populate('ownerId', 'name email')
      .limit(20);
  }

  // فلترة الكورسات
  async filterCourses(filter: { status?: string; minStudents?: number }) {
    const query: any = {};
    if (filter.status) query.status = filter.status;
    if (filter.minStudents) query.studentsEnrolled = { $exists: true, $not: { $size: 0 } };
    return this.courseModel.find(query).populate('ownerId', 'name email');
  }

  async searchUsers(query: string) {
    return this.userModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ]
    }).limit(20);
  }
}
