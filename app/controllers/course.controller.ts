
import { CourseService } from '../services/course.service';
import { ApplicationController } from './application.controller';

// Bắt buộc phải kế thừa "Controller" của ts-rails
export class CourseController extends ApplicationController {
  
  async list() {
    try {
      const filters = {
        // Truy cập thông qua this.req
        title: this.req.query.title as string,
        level: this.req.query.level as string,
        price: this.req.query.price as string,
        category: this.req.query.category as string,
      };
      
      const courses = await CourseService.getAllCourses(filters);
      
      // Trả về thông qua this.res
      return this.res.status(200).json(courses);
    } catch (error: any) {
      return this.res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }

  async upcoming() {
    try {
      const courses = await CourseService.getUpcomingCourses();
      return this.res.status(200).json(courses);
    } catch (error: any) {
      return this.res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }

  async detail() {
    try {
      // Truy cập params thông qua this.req.params
      const id = this.req.params.id as string;
      const course = await CourseService.getCourseDetail(id);
      
      if (!course) {
        return this.res.status(404).json({ message: "Không tìm thấy khóa học" });
      }
      return this.res.status(200).json(course);
    } catch (error: any) {
      return this.res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
}