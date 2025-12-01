import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('courses')
  async getCoursesWithChapters() {
    return this.dashboardService.getCoursesWithChapters();
  }

  @Get('courses/latest')
  async getLatestCourses(@Query('limit') limit: string) {
    return this.dashboardService.getLatestCourses(Number(limit) || 5);
  }

  @Get('chapters/latest')
  async getLatestChapters(@Query('limit') limit: string) {
    return this.dashboardService.getLatestChapters(Number(limit) || 5);
  }

  @Get('users')
  async getUsers(@Query() query: any) {
    return this.dashboardService.getUsers(query);
  }

  @Get('courses/popular')
  async getPopularCourses(@Query('limit') limit: string) {
    return this.dashboardService.getPopularCourses(Number(limit) || 5);
  }

  @Get('courses/search')
  async searchCourses(@Query('q') query: string) {
    return this.dashboardService.searchCourses(query);
  }

  @Get('courses/filter')
  async filterCourses(
    @Query('status') status?: string,
    @Query('minStudents') minStudents?: string
  ) {
    return this.dashboardService.filterCourses({
      status,
      minStudents: minStudents ? Number(minStudents) : undefined,
    });
  }

  @Get('users/search')
  async searchUsers(@Query('q') query: string) {
    return this.dashboardService.searchUsers(query);
  }
}