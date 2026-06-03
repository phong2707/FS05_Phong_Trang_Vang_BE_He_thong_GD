import models from "@models";
import { gradeEssayByAI } from "./ai-grading.service";
import striptags from "striptags";

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
  },
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
  // ✅ resolve subjectId (CHUẨN)
  let subjectId = test.subjectId;

  if (!subjectId && test.chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: test.chapterId },
      select: { subjectId: true },
    });

    subjectId = chapter?.subjectId || null;
  }

  // ✅ check class đơn giản (CHUẨN)
  
if (!subjectId) {
  throw new Error("Không xác định được subject");
}

  const validClass = await prisma.classGroup.findFirst({
    where: {
      id: data.classGroupId,
      subjectId: subjectId,
    },
  });

  if (!validClass) {
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
 * ✅ AI preview + save grading
 */
export async function gradeAssignment(
  teacherId: string,
  submissionId: string,
  data: {
    score?: number; // teacher override
    feedback?: string;
    useAI?: boolean;
    preview?: boolean; // ✅ preview mode
    maxMark?: number;
  },
) {
  // ✅ 1. LOAD submission
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      userAnswers: true,
      test: {
        include: {
          testQuestions: {
            include: {
              question: true,
            },
          },
        },
      },
    },
  });

  if (!submission) throw new Error("Submission không tồn tại");

  // ✅ 2. CHECK PERMISSION
  let subjectId: string | null = null;

  if (submission.test.subjectId) subjectId = submission.test.subjectId;

  if (!subjectId && submission.test.chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: submission.test.chapterId },
      select: { subjectId: true },
    });
    subjectId = chapter?.subjectId || null;
  }

  if (!subjectId && submission.test.courseId) {
    const subject = await prisma.subject.findFirst({
      where: { courseId: submission.test.courseId },
      select: { id: true },
    });
    subjectId = subject?.id || null;
  }

  if (!subjectId) throw new Error("Không xác định được subject");

  const allowed = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      teachers: {
        some: { teacherId },
      },
    },
  });

  if (!allowed) throw new Error("Không có quyền chấm bài");

  // ✅ 3. GET ESSAY
  const essay = submission.userAnswers[0]?.essayAnswer;
  if (!essay) throw new Error("Không có bài tự luận");

  // ✅ 4. GET RUBRIC
  const question = submission.test.testQuestions[0]?.question;

  const criteria = (question.explanation || []) as {
    name: string;
    max: number;
  }[];

  const cleanEssay = striptags(essay).slice(0, 5000);

  // ✅ 5. AI RESULT
  let aiResult = null;

  if (data.useAI) {
    aiResult = await gradeEssayByAI({
      maxMark: data.maxMark || 10,
      criteria,
      essayContent: cleanEssay,
    });
  }

  // ✅ 6. BUILD RESPONSE (CHO FE)
  const buildFeedback = (r: any) => `
👉 Tổng điểm: ${r.total}

${r.criteria
  .map((c: any) => `- ${c.name}: ${c.score}/${c.max}\n  Nhận xét: ${c.comment}`)
  .join("\n\n")}

👉 Kết luận:
${r.finalComment}
`;

  // ✅ ✅ CASE 1: PREVIEW (KHÔNG LƯU DB)
  if (data.preview) {
    return {
      preview: true,
      aiScore: aiResult?.total,
      aiFeedback: aiResult ? buildFeedback(aiResult) : null,
      criteria: aiResult?.criteria || [],
      raw: aiResult || null,
    };
  }

  // ✅ ✅ CASE 2: SAVE (teacher quyết định)

  const finalScore = data.score !== undefined ? data.score : aiResult?.total;

  const finalFeedback =
    data.feedback !== undefined
      ? data.feedback
      : aiResult
        ? buildFeedback(aiResult)
        : null;

  if (finalScore === undefined || finalScore === null) {
    throw new Error("Chưa có điểm để lưu");
  }

  const result = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      score: finalScore,
      teacherFeedback: finalFeedback,
      status: "GRADED",
      graderId: teacherId,
      finalScoreStatus:
        data.useAI && data.score === undefined ? "AI_GRADED" : "MANUAL_GRADED",

      aiGradingDetail: aiResult
        ? JSON.parse(JSON.stringify(aiResult))
        : undefined,
    },
  });

  return result;
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
