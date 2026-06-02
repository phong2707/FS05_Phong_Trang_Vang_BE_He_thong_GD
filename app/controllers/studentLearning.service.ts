import models from "@models";
import * as AssignmentService from "../services/assignment.service";
import * as TestService from "../services/test.service";

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
   * 6. Sinh viên nộp bài tập tự luận (Assignment)
   */
  async submitStudentAssignment(
    studentId: string,
    payload: {
      testId: string;
      classGroupId: string;
      essayAnswer: string;
    },
  ) {
    return AssignmentService.submitAssignment(studentId, payload);
  }

  /**
   * 7. Sinh viên bắt đầu làm bài kiểm tra (Test/Quiz)
   *    Tạo session và lấy snapshot câu hỏi
   */
  async startStudentTest(
    studentId: string,
    payload: {
      testId?: string; // Optional for random tests
      scope?: "CHAPTER" | "SUBJECT" | "COURSE"; // Required if testId is not provided
      chapterId?: string;
      subjectId?: string;
      courseId?: string;
      durationMinutes?: number;
      rule?: {
        easy?: number;
        medium?: number;
        hard?: number;
      };
    },
  ) {
    let finalTestId = payload.testId;
    let generatorInput: any = null; // This will be passed to getOrCreateSnapshot

    // Case 1: testId is provided (could be a fixed test or a pre-configured random test)
    if (finalTestId) {
      const existingTest = await models.test.findUnique({
        where: { id: finalTestId },
      });
      if (!existingTest) {
        throw new Error("Bài kiểm tra không tồn tại.");
      }
      // If the existing test is a RANDOM test, we need its generation parameters for the snapshot
      if (existingTest.mode === "RANDOM") {
        generatorInput = {
          scope: existingTest.scope,
          chapterId: existingTest.chapterId,
          subjectId: existingTest.subjectId,
          courseId: existingTest.courseId,
          rule: payload.rule, // Allow overriding rule for existing random test if desired
        };
      }
    } else {
      // Case 2: testId is NOT provided, meaning it's a new random test generation request
      const scope = payload.scope;
      if (!scope) {
        throw new Error("Scope là bắt buộc để tạo bài kiểm tra ngẫu nhiên.");
      }
      generatorInput = {
        scope,
        chapterId: payload.chapterId,
        subjectId: payload.subjectId,
        courseId: payload.courseId,
        rule: payload.rule,
      };
      const tempTest = await TestService.createTempTest({
        scope,
        chapterId: payload.chapterId,
        subjectId: payload.subjectId,
        courseId: payload.courseId,
        durationMinutes: payload.durationMinutes,
      });
      finalTestId = tempTest.id;
    }

    if (!finalTestId) {
      throw new Error("Không thể tạo hoặc tìm thấy bài kiểm tra.");
    }

    // Create session
    const session = await TestService.createExamSession(studentId, finalTestId);

    // Get or create snapshot
    const snapshot = await TestService.getOrCreateSnapshot(studentId, {
      testId: finalTestId,
      generatorInput: generatorInput, // Pass generatorInput for random tests
    });

    return {
      testId: finalTestId,
      sessionToken: session.token,
      questions: snapshot,
    };
  }

  /**
   * 8. Sinh viên nộp bài kiểm tra (Test/Quiz)
   */
  async submitStudentTest(
    studentId: string,
    payload: {
      testId: string;
      classGroupId: string;
      sessionToken: string;
      answers: {
        questionId: string;
        answerId?: string;
        essayAnswer?: string; // Though essayAnswer should go to assignment service
      }[];
    },
  ) {
    const submission = await TestService.submitTest(studentId, payload);
    const graded = await TestService.autoGrade(submission.id);
    return graded;
  }
}
