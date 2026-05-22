import models from "@models";

export class StudentLearningService {
  /**
   * 1. Lấy lịch học của sinh viên
   */
  async getStudentSchedule(studentId: string) {
    // Lấy danh sách các classGroupId mà sinh viên đang học
    const enrollments = await models.classGroupUser.findMany({
      where: { userId: studentId, role: "STUDENT" },
      select: { classGroupId: true },
    });

    const classGroupIds = enrollments.map((e) => e.classGroupId);

    if (classGroupIds.length === 0) {
      return [];
    }

    // Lấy lịch học của các lớp đó
    return models.schedule.findMany({
      where: { classGroupId: { in: classGroupIds } },
      include: {
        classGroup: {
          select: {
            id: true,
            name: true,
            roomLink: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startAt: "asc",
      },
    });
  }

  /**
   * 2. Lấy tài liệu/bài giảng theo subjectId cho sinh viên
   */
  async getSubjectMaterials(studentId: string, subjectId: string) {
    // Kiểm tra sinh viên có đang học môn này không (thông qua classGroup)
    const isEnrolled = await models.classGroupUser.findFirst({
      where: {
        userId: studentId,
        role: "STUDENT",
        classGroup: {
          subjectId: subjectId,
        },
      },
    });

    if (!isEnrolled) {
      throw new Error(
        "Bạn không có quyền truy cập tài liệu của môn học này vì chưa được ghi danh.",
      );
    }

    // Lấy danh sách chương học và tài liệu (video, bài tập/tài liệu taskmen, quiz)
    return models.chapter.findMany({
      where: { subjectId: subjectId },
      include: {
        videos: {
          select: {
            id: true,
            title: true,
            videoUrl: true,
            durationSeconds: true,
            provider: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        taskmen: {
          select: {
            id: true,
            title: true,
            url: true,
            fileType: true,
          },
        },
        tests: {
          select: {
            id: true,
            title: true,
            testType: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });
  }

  /**
   * 3. Lấy danh sách các môn học sinh viên đang học để tiện tra cứu tài liệu
   */
  async getEnrolledSubjects(studentId: string) {
    const enrollments = await models.classGroupUser.findMany({
      where: { userId: studentId, role: "STUDENT" },
      include: {
        classGroup: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Lọc ra danh sách các subject không trùng lặp
    const subjectsMap = new Map();
    for (const e of enrollments) {
      if (e.classGroup?.subject) {
        subjectsMap.set(e.classGroup.subject.id, e.classGroup.subject);
      }
    }

    return Array.from(subjectsMap.values());
  }

  /**
   * 4. Lấy danh sách điểm số môn học của sinh viên
   */
  async getStudentGrades(studentId: string) {
    return models.subjectGrade.findMany({
      where: { userId: studentId },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * 5. Lấy lịch sử điểm danh của sinh viên
   */
  async getStudentAttendances(studentId: string) {
    return models.attendance.findMany({
      where: { userId: studentId },
      include: {
        schedule: {
          include: {
            classGroup: {
              select: {
                id: true,
                name: true,
                subject: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  }
}
