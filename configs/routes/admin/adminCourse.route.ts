import { AdminCourseController } from "@controllers";
import { action, RailsRoute } from "ts-rails";

export class AdminCourseRoute extends RailsRoute {
  public draw() {
    // Lấy danh sách giáo viên (Chỉ cần quyền Xem khóa học hoặc Thêm/Sửa khóa học)
    this.get(
      "/teachers",
      action(AdminCourseController, "getTeachers"),
      {
        setPermissionForAny: ["COURSE_VIEW", "COURSE_EDIT"]
      }
    );

    // Lấy danh sách tất cả khóa học
    this.get(
      "/",
      action(AdminCourseController, "getAllCourses"),
      {
        setPermissionForAny: ["COURSE_VIEW", "COURSE_EDIT"]
      }
    );

    // Tạo khóa học mới (Bắt buộc phải có quyền EDIT)
    this.post(
      "/",
      action(AdminCourseController, "createCourse"),
      {
        setPermissionForAny: ["COURSE_EDIT"]
      }
    );

    // Lấy chi tiết khóa học
    this.get(
      "/:id",
      action(AdminCourseController, "getCourseDetail"),
      {
        setPermissionForAny: ["COURSE_VIEW", "COURSE_EDIT"]
      }
    );

    // Cập nhật khóa học
    this.put(
      "/:id",
      action(AdminCourseController, "updateCourse"),
      {
        setPermissionForAny: ["COURSE_EDIT"]
      }
    );
  }
}