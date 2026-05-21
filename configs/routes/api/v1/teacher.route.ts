import { RailsRoute, action } from "ts-rails";
import { TeacherController } from "@controllers";

export class TeacherRoute extends RailsRoute {
  public draw() {
    this.get("/subjects", action(TeacherController, "getAssignedSubjects"));
    this.get("/subjects/:id", action(TeacherController, "getAssignedSubjectDetail"));

    this.get("/subjects/:id/attendance/sessions", action(TeacherController, "getAttendanceSessions"));
    this.get("/subjects/:id/attendance/stats", action(TeacherController, "getAttendanceStats"));
    this.get(
      "/subjects/:id/attendance/sessions/:sessionId/records",
      action(TeacherController, "getAttendanceSessionRecords")
    );
    this.post("/subjects/:id/attendance/sessions", action(TeacherController, "createAttendanceSession"));
    this.put(
      "/subjects/:id/attendance/sessions/:sessionId/records",
      action(TeacherController, "updateAttendanceSessionRecords")
    );
    this.patch(
      "/subjects/:id/attendance/sessions/:sessionId/complete",
      action(TeacherController, "completeAttendanceSession")
    );
  }
}
