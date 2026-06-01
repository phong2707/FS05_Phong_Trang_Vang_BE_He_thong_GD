import models from "@models";
import crypto from "crypto";

import { getCache, setCache } from "@services/cache.service";
import { generateTestAutomatically } from "@services/test-generator.service";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
  },
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
  let subjectId: string = "";

  if (data.scope === "CHAPTER") {
    if (!data.chapterId) throw new Error("Thiếu chapterId");

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: data.chapterId!,
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
        id: data.subjectId!,
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
        courseId: data.courseId!,
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
  const questionWhere: any = {
    id: { in: data.questionIds },
  };

  if (data.scope === "CHAPTER") {
    const chapter = await prisma.chapter.findUnique({
      where: { id: data.chapterId! },
      include: { subject: true },
    });

    const courseId = chapter?.subject.courseId;

    questionWhere.OR = [
      { chapterId: data.chapterId },
      { subjectId },
      courseId ? { courseId } : undefined,
    ].filter(Boolean);
  }

  if (data.scope === "SUBJECT") {
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId! },
    });

    const courseId = subject?.courseId;

    questionWhere.OR = [
      { subjectId: data.subjectId },
      courseId ? { courseId } : undefined,
    ].filter(Boolean);
  }

  if (data.scope === "COURSE") {
    questionWhere.courseId = data.courseId;
  }

  const questions = await prisma.question.findMany({
    where: questionWhere,
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

      mode: "FIXED",

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
    sessionToken: string;
    answers: {
      questionId: string;
      answerId?: string;
      essayAnswer?: string;
    }[];
  },
) {
  // ✅ 1. fetch test
  const test = await prisma.test.findUnique({
    where: { id: data.testId },

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
              id: test.chapterId!,
            },
          },
        },
      },
    }));
  }

  if (test.scope === "SUBJECT") {
    isValid = !!(await prisma.classGroup.findFirst({
      where: {
        id: data.classGroupId,
        subjectId: test.subjectId!,
      },
    }));
  }

  if (test.scope === "COURSE") {
    isValid = !!(await prisma.classGroup.findFirst({
      where: {
        id: data.classGroupId,
        subject: {
          courseId: test.courseId!,
        },
      },
    }));
  }

  if (!isValid) {
    throw new Error("Test không thuộc lớp này");
  }

  /**
   * ✅ ✅ ANTI-CHEAT SESSION TOKEN
   */
  const session = await prisma.examSession.findUnique({
    where: { token: data.sessionToken },
  });

  if (!session || session.studentId !== studentId) {
    throw new Error("Session không hợp lệ");
  }

  if (session.expiresAt < new Date()) {
    throw new Error("Session đã hết hạn");
  }

  const snapshot = await prisma.testSnapshot.findUnique({
    where: {
      testId_studentId: {
        testId: data.testId,
        studentId,
      },
    },
  });

  if (!snapshot) {
    throw new Error("Không tìm thấy snapshot");
  }

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(snapshot.data))
    .digest("hex");

  if (hash !== snapshot.hash) {
    throw new Error("Dữ liệu bài thi bị thay đổi");
  }

  /**
   * ✅ ✅ TIMER REALTIME
   */
  const startTime = session.createdAt;
  const maxTime = test.durationMinutes * 60 * 1000;

  if (Date.now() - startTime.getTime() > maxTime) {
    throw new Error("Hết thời gian");
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
  // ✅ 4. check câu hỏi hợp lệ (FIXED vs RANDOM)

  let validQuestionIds: string[] = [];

  if (test.mode === "FIXED") {
    validQuestionIds = test.testQuestions.map((q) => q.questionId);
  } else {
    // ✅ RANDOM → lấy từ snapshot
    validQuestionIds = (snapshot.data as any[]).map((q) => q.id);
  }

  for (const ans of data.answers) {
    if (!validQuestionIds.includes(ans.questionId)) {
      throw new Error("Câu hỏi không hợp lệ");
    }
  }

  // ✅ 5. check đủ câu
  const totalQuestions =
    test.mode === "FIXED"
      ? test.testQuestions.length
      : (snapshot.data as any[]).length;

  if (data.answers.length !== totalQuestions) {
    throw new Error("Bạn chưa trả lời đầy đủ câu hỏi");
  }

  // ✅ 6. check duplicate
  const unique = new Set(data.answers.map((a) => a.questionId));
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
        create: data.answers.map((a) => ({
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
                      isCorrect: true,
                    },
                  },
                },
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
      (q) => q.questionId === ans.questionId,
    )?.question;

    const correct = question?.answers.find((a) => a.isCorrect);

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

export async function getOrCreateSnapshot(
  studentId: string,
  data: {
    testId: string;
    generatorInput: any;
  },
) {
  const cacheKey = `snapshot:${studentId}:${data.testId}`;

  // ✅ 1. CHECK CACHE TRƯỚC (FASTEST)
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // ✅ 2. CHECK DB
  const existed = await prisma.testSnapshot.findUnique({
    where: {
      testId_studentId: {
        testId: data.testId,
        studentId,
      },
    },
  });

  if (existed) {
    setCache(cacheKey, existed.data); // ✅ cache lại
    return existed.data;
  }

  // ✅ 3. GENERATE MỚI
  // ✅ lấy test để check mode
  const test = await prisma.test.findUnique({
    where: { id: data.testId },
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

  if (!test) {
    throw new Error("Test không tồn tại");
  }

  let generated;

  if (test?.mode === "FIXED") {
    generated = test.testQuestions.map((q) => ({
      ...q.question,

      answers: shuffleArray(q.question.answers).map((a) => ({
        id: a.id,
        answerText: a.answerText,
      })),
    }));
  } else {
    generated = await generateTestAutomatically(data.generatorInput);
  }

  // ✅ 4. HASH chống sửa
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(generated))
    .digest("hex");

  // ✅ 5. SAVE DB
  const snapshot = await prisma.testSnapshot.create({
    data: {
      testId: data.testId,
      studentId,
      data: generated,
      hash,
    },
  });

  // ✅ 6. CACHE
  setCache(cacheKey, snapshot.data);

  return snapshot.data;
}

export async function createExamSession(studentId: string, testId: string) {
  const token = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

  const session = await prisma.examSession.create({
    data: {
      testId,
      studentId,
      token,
      expiresAt,
    },
  });

  return session;
}

export async function logCheat(
  studentId: string,
  testId: string,
  type: string,
) {
  return prisma.cheatLog.create({
    data: {
      studentId,
      testId,
      type,
    },
  });
}

export async function getLeaderboard(testId: string) {
  return prisma.submission.findMany({
    where: { testId, status: "GRADED" },
    orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
    take: 50,
    include: {
      student: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export async function createTempTest(data: {
  scope: "CHAPTER" | "SUBJECT" | "COURSE";
  chapterId?: string;
  subjectId?: string;
  courseId?: string;
  durationMinutes?: number;
}) {
  return prisma.test.create({
    data: {
      title: "Generated Test",
      scope: data.scope,

      chapterId: data.chapterId || null,
      subjectId: data.subjectId || null,
      courseId: data.courseId || null,

      durationMinutes: data.durationMinutes || 60,
      testType: "QUIZ",

      mode: "RANDOM", // ✅ QUAN TRỌNG

      // ✅ KHÔNG có questionIds vì RANDOM
      // snapshot sẽ giữ đề thật
    },
  });
}
