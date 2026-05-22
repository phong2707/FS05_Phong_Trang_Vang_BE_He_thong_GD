import { StudentLearningController } from "../../app/controllers/studentLearning.controller";
import { action, RailsRoute } from "ts-rails";

export class StudentLearningRoute extends RailsRoute {
  public draw() {
    // GET /student/schedules - Lấy lịch học của sinh viên
    this.get("/schedules", action(StudentLearningController, "getSchedules"));

    // GET /student/subjects - Lấy danh sách môn học sinh viên đang tham gia
    this.get("/subjects", action(StudentLearningController, "getMySubjects"));

    // GET /student/subjects/:subjectId/materials - Lấy tài liệu (chương trình học, videos, bài tập)
    this.get(
      "/subjects/:subjectId/materials",
      action(StudentLearningController, "getMaterials"),
    );

    // GET /student/grades - Lấy điểm số của sinh viên
    this.get("/grades", action(StudentLearningController, "getMyGrades"));

    // GET /student/attendances - Lấy lịch sử điểm danh của sinh viên
    this.get(
      "/attendances",
      action(StudentLearningController, "getMyAttendances"),
    );
  }
}
