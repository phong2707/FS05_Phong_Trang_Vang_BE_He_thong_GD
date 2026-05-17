import models from "@models";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

/**
 * ✅ Student nộp bài (file)
 */
export async function submitAssignment(
  studentId: string,
  data: {
    testId: string;
    classGroupId: string;
    essayAnswer: string; // ✅ WYSIWYG HTML
  }
) {
  const test = await prisma.test.findUnique({
    where: { id: data.testId },
    include: { testQuestions: true },
  });

  if (!test) throw new Error("Bài không tồn tại");

  if (test.testType !== "ASSIGNMENT") {
    throw new Error("Không phải bài tự luận");
  }

  const question = test.testQuestions[0];
  if (!question) {
    throw new Error("Assignment phải có 1 câu hỏi");
  }

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
            essayAnswer: data.essayAnswer, // ✅ HTML TEXT
            isCorrect: false,
          },
        ],
      },
    },
    include: { userAnswers: true },
  });
}

/**
 * ✅ Teacher chấm bài
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

  // ✅ check teacher thuộc subject
  const subject = await prisma.subject.findFirst({
    where: {
      id: submission.test.subjectId,
      teachers: {
        some: { teacherId },
      },
    },
  });

  if (!subject) {
    throw new Error("Không có quyền chấm bài");
  }

  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      score: data.score,
      status: "GRADED",
      graderId: teacherId,
      finalScoreStatus: "MANUAL_GRADED",

      // ✅ có thể lưu feedback text sau này
      // feedback: data.feedback,
      // feedbackFile: data.feedbackFile,
    },
  });
}

/**
 * ✅ Lấy danh sách bài đã nộp theo test
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