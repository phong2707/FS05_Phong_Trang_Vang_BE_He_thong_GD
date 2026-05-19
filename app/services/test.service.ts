import models from "@models";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

/**
 * ✅ Tạo bài test (quiz / assignment)
 */
export async function createTest(
  teacherId: string,
  data: {
    scope: "CHAPTER" | "SUBJECT" | "COURSE";

    chapterId?: string;
    subjectId?: string;
    courseId?: string;

    title: string;
    testType: "QUIZ" | "ESSAY";
    durationMinutes: number;
    startTime?: Date;
    endTime?: Date;
    questionIds: string[];
  }
) {

  // 🔥 FIX: chống gửi nhiều scope
  const scopeCount =
    Number(!!data.chapterId) +
    Number(!!data.subjectId) +
    Number(!!data.courseId);

  if (scopeCount !== 1) {
    throw new Error("Chỉ được chọn 1 scope");
  }

  // ✅ 1. validate scope + quyền
  let subjectId: string;

  if (data.scope === "CHAPTER") {
    if (!data.chapterId) throw new Error("Thiếu chapterId");

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: data.chapterId,
        subject: {
          teachers: { some: { teacherId } },
        },
      },
      select: { subjectId: true },
    });

    if (!chapter) throw new Error("Không có quyền");

    subjectId = chapter.subjectId;
  }

  if (data.scope === "SUBJECT") {
    if (!data.subjectId) throw new Error("Thiếu subjectId");

    const subject = await prisma.subject.findFirst({
      where: {
        id: data.subjectId,
        teachers: { some: { teacherId } },
      },
    });

    if (!subject) throw new Error("Không có quyền");

    subjectId = subject.id;
  }

  if (data.scope === "COURSE") {
    if (!data.courseId) throw new Error("Thiếu courseId");

    const subject = await prisma.subject.findFirst({
      where: {
        courseId: data.courseId,
        teachers: {
          some: { teacherId }, // ✅ FIX SECURITY
        },
      },
      select: { id: true },
    });

    if (!subject) throw new Error("Không có quyền");

    subjectId = subject.id;
  }

  // ✅ validate question
  const questions = await prisma.question.findMany({
    where: {
      id: { in: data.questionIds },
      subjectId,
    },
  });

  if (questions.length !== data.questionIds.length) {
    throw new Error("Có câu hỏi không thuộc đúng phạm vi");
  }

  // ✅ build scope field
  const connectData: any = {};

  if (data.scope === "CHAPTER") {
    connectData.chapterId = data.chapterId;
  }

  if (data.scope === "SUBJECT") {
    connectData.subjectId = data.subjectId;
  }

  if (data.scope === "COURSE") {
    connectData.courseId = data.courseId;
  }

  return prisma.test.create({
    data: {
      scope: data.scope,
      ...connectData,
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

    // ✅ BONUS: FE cực thích cái này
    include: {
      testQuestions: {
        include: {
          question: {
            include: { answers: true },
          },
        },
      },
    },
  });
}

/* ✅ 1.2 List Test */
export async function listTestsByChapter(chapterId: string) {
  return prisma.test.findMany({
    where: {
      chapterId,
      scope: "CHAPTER",
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listTestsBySubject(subjectId: string) {
  return prisma.test.findMany({
    where: {
      subjectId,
      scope: "SUBJECT",
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listTestsByCourse(courseId: string) {
  return prisma.test.findMany({
    where: {
      courseId,
      scope: "COURSE",
    },
    orderBy: { createdAt: "desc" },
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
  testQuestions: {
    include: {
      question: {
        include: {
          answers: true
        }
      }
    }
  }
},
});

if (!test) {
  throw new Error("Test không tồn tại");
}



if (!["CHAPTER", "SUBJECT", "COURSE"].includes(test.scope)) {
  throw new Error("Test scope không hợp lệ");
}



// ✅ thêm đoạn này
if (test.testType === "ESSAY") {
  throw new Error("Bài tự luận phải nộp qua assignment API");
}

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

let isValid = false;

if (test.scope === "CHAPTER") {
  isValid = !!(await prisma.classGroup.findFirst({
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

if (test.scope === "SUBJECT") {
  isValid = !!(await prisma.classGroup.findFirst({
    where: {
      id: data.classGroupId,
      subjectId: test.subjectId
    }
  }));
}

if (test.scope === "COURSE") {
  isValid = !!(await prisma.classGroup.findFirst({
    where: {
      id: data.classGroupId,
      subject: {
        courseId: test.courseId
      }
    }
  }));
}

if (!isValid) {
  throw new Error("Test không thuộc lớp này");
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
  const attemptsCount = await prisma.submission.count({
  where: {
    testId: data.testId,
    studentId,
  },
});

if (attemptsCount >= test.maxAttempts) {
  throw new Error("Bạn đã hết số lần làm bài");
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
  include: {
    answers: {
      where: {
        isCorrect: true
      }
    }
  }
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