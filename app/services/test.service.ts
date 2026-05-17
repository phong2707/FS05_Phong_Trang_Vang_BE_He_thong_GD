import models from "@models";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

/**
 * ✅ Tạo bài test (quiz / assignment)
 */
export async function createTest(
  teacherId: string,
  data: {
    subjectId: string;
    title: string;
    testType: string;
    durationMinutes: number;
    startTime?: Date;
    endTime?: Date;
    questionIds: string[];
  }
) {
  const subject = await prisma.subject.findFirst({
    where: {
      id: data.subjectId,
      teachers: {
        some: { teacherId },
      },
    },
  });

  if (!subject) {
    throw new Error("Không có quyền tạo test cho môn này");
  }

  if (!data.questionIds || data.questionIds.length === 0) {
    throw new Error("Phải có ít nhất 1 câu hỏi");
  }

  return prisma.test.create({
    data: {
      subjectId: data.subjectId,
      title: data.title,
      testType: data.testType,
      durationMinutes: data.durationMinutes,
      startTime: data.startTime,
      endTime: data.endTime,

      testQuestions: {
        create: data.questionIds.map((qId, index) => ({
          questionId: qId,
          points: 1,
          sortOrder: index + 1,
        })),
      },
    },
    include: {
      testQuestions: {
        include: {
          question: {
            include: {
              answers: true,
            },
          },
        },
      },
    },
  });
}

/* ✅ 1.2 List Test */
export async function listTests(subjectId: string) {
  return prisma.test.findMany({
    where: { subjectId },
    include: {
      testQuestions: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/* ✅ 1.3 Get Test Detail */
export async function getTestDetail(testId: string) {
  return prisma.test.findUnique({
    where: { id: testId },
    include: {
      testQuestions: {
        include: {
          question: {
            include: {
              answers: true,
            },
          },
        },
      },
    },
  });
}

/* ✅ 1.4 Submit bài (ĐÃ HARDEN) */
export async function submitTest(
  studentId: string,
  data: {
    testId: string;
    classGroupId: string;
    answers: {
      questionId: string;
      answerId?: string;
      essayAnswer?: string;
    }[];
  }
) {
  // ✅ 1. fetch test
  const test = await prisma.test.findUnique({
  where: { id: data.testId },
  include: {
    testQuestions: true,
  },
});

if (!test) {
  throw new Error("Test không tồn tại");
}

// ✅ thêm đoạn này
if (test.testType === "ASSIGNMENT") {
  throw new Error("Bài tự luận phải nộp qua assignment API");
}

  // ✅ 2. check thời gian
  const now = new Date();

  if (test.startTime && now < test.startTime) {
    throw new Error("Chưa đến giờ làm bài");
  }

  if (test.endTime && now > test.endTime) {
    throw new Error("Đã hết giờ làm bài");
  }

  // ✅ 3. chống làm nhiều lần
  const existed = await prisma.submission.findFirst({
    where: {
      testId: data.testId,
      studentId,
    },
  });

  if (existed) {
    throw new Error("Bạn đã làm bài này rồi");
  }

  // ✅ 4. check câu hỏi hợp lệ
  const validQuestionIds = test.testQuestions.map(q => q.questionId);

  for (const ans of data.answers) {
    if (!validQuestionIds.includes(ans.questionId)) {
      throw new Error("Câu hỏi không hợp lệ");
    }
  }

  // ✅ 5. check đủ câu
  if (data.answers.length !== test.testQuestions.length) {
    throw new Error("Bạn chưa trả lời đầy đủ câu hỏi");
  }

  // ✅ 6. check duplicate
  const unique = new Set(data.answers.map(a => a.questionId));
  if (unique.size !== data.answers.length) {
    throw new Error("Duplicate câu trả lời");
  }

  // ✅ 7. create submission
  const submission = await prisma.submission.create({
    data: {
      testId: data.testId,
      studentId,
      classGroupId: data.classGroupId,

      userAnswers: {
        create: data.answers.map(a => ({
          questionId: a.questionId,
          answerId: a.answerId,
          essayAnswer: a.essayAnswer,
          isCorrect: false,
        })),
      },
    },
    include: {
      userAnswers: true,
    },
  });

  return submission;
}

/* ✅ 1.5 AUTO CHẤM */
export async function autoGrade(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      test: {
        include: {
          testQuestions: {
            include: {
              question: {
                include: { answers: true },
              },
            },
          },
        },
      },
      userAnswers: true,
    },
  });

  let score = 0;
  let total = submission!.userAnswers.length;

  for (const ans of submission!.userAnswers) {
    const question = submission!.test.testQuestions.find(
      q => q.questionId === ans.questionId
    )?.question;

    const correct = question?.answers.find(a => a.isCorrect);

    if (correct?.id === ans.answerId) {
      await prisma.userQuestionAnswer.update({
        where: { id: ans.id },
        data: { isCorrect: true },
      });
      score++;
    }
  }

  const finalScore = (score / total) * 10;

  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      score: finalScore,
      status: "GRADED",
      finalScoreStatus: "AUTO_GRADED",
    },
  });
}