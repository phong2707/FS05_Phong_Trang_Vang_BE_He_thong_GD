import { RailsController, UnauthorizedError } from "ts-rails";
import { StudentCourseService } from "../services/course.service";

export class StudentCoursesController extends RailsController {
  private courseService = new StudentCourseService();

  // Hàm tiện ích lấy User ID (Giả sử middleware của bạn đã gắn userId vào request session/user)
  private get currentUserId(): string {
    const reqAny = this.req as any;
    const userId = reqAny.user?.id || reqAny.session?.userId;
    if (!userId)
      throw new UnauthorizedError(
        "Bạn cần đăng nhập để thực hiện chức năng này.",
      );
    return userId;
  }

  // [GET] Xem danh sách
  async index() {
    const courses = await this.courseService.getList();
    return this.renderJson({ success: true, data: courses });
  }

  // [GET] Xem chi tiết
  async show() {
    const courseId = this.req.params.id;
    const course = await this.courseService.getDetails(courseId);
    return this.renderJson({ success: true, data: course });
  }

  // [POST] Đăng ký khóa học
  async register() {
    const courseId = this.req.params.id;
    const result = await this.courseService.register(
      this.currentUserId,
      courseId,
    );

    // Trả về 201 Created nếu đăng ký thành công
    if (this.req.xhr || this.req.headers.accept?.includes("json")) {
      return this.renderJson({ success: true, data: result }, 201);
    }
    this.redirect("/student/courses");
  }

  // [POST/DELETE] Rút khỏi khóa học
  async withdraw() {
    const courseId = this.req.params.id;
    const result = await this.courseService.withdraw(
      this.currentUserId,
      courseId,
    );

    return this.renderJson({ success: true, data: result });
  }
}
