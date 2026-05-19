import models from "@models";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

/**
 * ✅ Student nộp bài (essay)
 */
export async function submitAssignment(
  studentId: string,
  data: {
    testId: string;
    classGroupId: string;
    essayAnswer: string;
  }
) {
  const test = await prisma.test.findUnique({
    where: { id: data.testId },
    include: { testQuestions: true },
  });

  if (!test) throw new Error("Bài không tồn tại");

  if (test.testType !== "ESSAY") {
    throw new Error("Không phải bài tự luận");
  }

  // ✅ CHECK student thuộc lớp
  const isStudentInClass = await prisma.classGroupUser.findUnique({
    where: {
      userId_classGroupId: {
        userId: studentId,
        classGroupId: data.classGroupId,
      },
    },
  });

  if (!isStudentInClass) {
    throw new Error("Bạn không thuộc lớp này");
  }

  // ✅ CHECK test thuộc class
  let valid = false;

if (test.chapterId) {
  valid = !!(await prisma.classGroup.findFirst({
    where: {
      id: data.classGroupId,
      subject: {
        chapters: {
          some: {
            id: test.chapterId
          }
        }
      }
    }
  }));
}

if (!valid && test.subjectId) {
  valid = !!(await prisma.classGroup.findFirst({
    where: {
      id: data.classGroupId,
      subjectId: test.subjectId
    }
  }));
}

if (!valid && test.courseId) {
  valid = !!(await prisma.classGroup.findFirst({
    where: {
      id: data.classGroupId,
      subject: {
        courseId: test.courseId
      }
    }
  }));
}

if (!valid) {
  throw new Error("Test không thuộc lớp");
}

  

  // ✅ lấy câu hỏi assignment
  const question = test.testQuestions[0];
  if (!question) {
    throw new Error("Assignment phải có 1 câu hỏi");
  }

  // ✅ chống nộp nhiều lần
  const existed = await prisma.submission.findFirst({
    where: {
      testId: data.testId,
      studentId,
    },
  });

  if (existed) {
    throw new Error("Bạn đã nộp bài rồi");
  }

  return prisma.submission.create({
    data: {
      testId: data.testId,
      studentId,
      classGroupId: data.classGroupId,
      status: "PENDING",
      finalScoreStatus: "MANUAL_PENDING",
      userAnswers: {
        create: [
          {
            questionId: question.questionId,
            essayAnswer: data.essayAnswer,
            isCorrect: false,
          },
        ],
      },
    },
    include: { userAnswers: true },
  });
}

/**
 * ✅ Teacher chấm bài (FIX MULTI SCOPE)
 */
export async function gradeAssignment(
  teacherId: string,
  submissionId: string,
  data: {
    score: number;
    feedback?: string;
    feedbackFile?: string;
  }
) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      test: true,
    },
  });

  if (!submission) {
    throw new Error("Submission không tồn tại");
  }

  // ✅ FIX: resolve subjectId theo scope
  let subjectId: string | null = null;

  if (submission.test.subjectId) {
    subjectId = submission.test.subjectId;
  }

  if (!subjectId && submission.test.chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: submission.test.chapterId },
      select: { subjectId: true },
    });

    subjectId = chapter?.subjectId || null;
  }

  if (!subjectId && submission.test.courseId) {
    const subject = await prisma.subject.findFirst({
      where: {
        courseId: submission.test.courseId,
      },
      select: { id: true },
    });

    subjectId = subject?.id || null;
  }

  if (!subjectId) {
    throw new Error("Không xác định được subject");
  }

  // ✅ CHECK teacher có quyền
  const allowed = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      teachers: {
        some: { teacherId },
      },
    },
  });

  if (!allowed) {
    throw new Error("Không có quyền chấm bài");
  }

  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      score: data.score,
      status: "GRADED",
      graderId: teacherId,
      finalScoreStatus: "MANUAL_GRADED",
    },
  });
}

/**
 * ✅ Lấy danh sách bài nộp theo test
 */
export async function listSubmissions(testId: string) {
  return prisma.submission.findMany({
    where: { testId },
    include: {
      student: {
        select: {
          id: true,
          email: true,
        },
      },
      userAnswers: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });
}