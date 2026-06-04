import models from "@models";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

/**
 * ✅ Tạo câu hỏi
 */
export async function createQuestion(
  teacherId: string,
  data: {
    scope?: "CHAPTER" | "SUBJECT" | "COURSE";

    chapterId?: string;
    subjectId?: string;
    courseId?: string;

    typeId: string;
    content: string;
    explanation?: string;
    questionFormat?: string;
    difficulty?: string;

    answers?: {
      answerText: string;
      isCorrect: boolean;
      orderIndex: number;
    }[];
  },
) {
  const scope = data.scope || "CHAPTER";

  /**
   * ✅ ENFORCE SCOPE RULE
   */
  if (scope === "CHAPTER" && !data.chapterId) {
    throw new Error("CHAPTER phải có chapterId");
  }
  if (scope === "SUBJECT" && !data.subjectId) {
    throw new Error("SUBJECT phải có subjectId");
  }
  if (scope === "COURSE" && !data.courseId) {
    throw new Error("COURSE phải có courseId");
  }

  /**
   * ✅ LẤY CHAPTER + SUBJECT + COURSE
   */
  let chapter = null;
  let subjectId = data.subjectId || null;
  let courseId = data.courseId || null;

  /**
   * ✅ CASE CHAPTER
   */
  if (data.chapterId) {
    chapter = await prisma.chapter.findFirst({
      where: {
        id: data.chapterId,
        subject: {
          teachers: {
            some: { teacherId },
          },
        },
      },
      include: {
        subject: true,
      },
    });

    if (!chapter) {
      throw new Error("Không có quyền tạo câu hỏi cho chương này");
    }

    subjectId = chapter.subjectId;
    courseId = chapter.subject.courseId;
  }

  /**
   * ✅ ✅ NEW: CASE SUBJECT
   */
  if (scope === "SUBJECT" && data.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: {
        id: data.subjectId,
        teachers: {
          some: { teacherId },
        },
      },
    });

    if (!subject) {
      throw new Error("Không có quyền tạo câu hỏi cho môn này");
    }

    subjectId = subject.id;
    courseId = subject.courseId; // ✅ QUAN TRỌNG
  }

  /**
   * ✅ ✅ NEW: CASE COURSE
   */
  if (scope === "COURSE" && data.courseId) {
    const subject = await prisma.subject.findFirst({
      where: {
        courseId: data.courseId,
        teachers: {
          some: { teacherId },
        },
      },
    });

    if (!subject) {
      throw new Error("Không có quyền tạo câu hỏi cho khóa này");
    }

    courseId = data.courseId;
  }
  /**
   * ✅ Validate nội dung
   */
  if (!data.content?.trim()) {
    throw new Error("Nội dung câu hỏi không hợp lệ");
  }

  const format = data.questionFormat || "SINGLE_CHOICE";

  /**
   * ✅ ESSAY
   */
  if (format === "ESSAY") {
    return prisma.question.create({
      data: {
        scope,
        chapterId: data.chapterId || null,
        subjectId,
        courseId,

        teacherId,
        typeId: data.typeId,
        questionFormat: "ESSAY",
        content: data.content,
        explanation: data.explanation,
        difficulty: data.difficulty || "MEDIUM",
      },
    });
  }

  /**
   * ✅ TRẮC NGHIỆM
   */
  if (!data.answers || data.answers.length === 0) {
    throw new Error("Câu hỏi phải có đáp án");
  }

  if (format === "SINGLE_CHOICE") {
    const correctCount = data.answers.filter((a) => a.isCorrect).length;

    if (correctCount !== 1) {
      throw new Error("Câu SINGLE phải có đúng 1 đáp án đúng");
    }
  }

  const answersWithOrder = data.answers.map((a, i) => ({
    ...a,
    orderIndex: i + 1,
  }));

  return prisma.question.create({
    data: {
      scope,
      chapterId: data.chapterId || null,
      subjectId,
      courseId,

      teacherId,
      typeId: data.typeId,
      questionFormat: format,
      content: data.content,
      explanation: data.explanation,
      difficulty: data.difficulty || "MEDIUM",

      answers: {
        create: answersWithOrder,
      },
    },
    include: {
      answers: true,
    },
  });
}
/**
 * ✅ Danh sách câu hỏi
 */
export async function listQuestions(
  subjectId: string | undefined,
  teacherId: string,
  filter?: {
    questionFormat?: string;
    typeId?: string;
    search?: string;
    difficulty?: string;
    chapterId?: string;
  },
  pagination?: { page: number; pageSize: number },
) {
  const where: any = {
    subjectId,
    subject: {
      teachers: {
        some: { teacherId },
      },
    },
  };

  if (filter) {
    if (filter.questionFormat) where.questionFormat = filter.questionFormat;
    if (filter.typeId) where.typeId = filter.typeId;
    if (filter.search) where.content = { contains: filter.search };

    if (filter.difficulty) where.difficulty = filter.difficulty;
    if (filter.chapterId) where.chapterId = filter.chapterId;
  }

  if (pagination) {
    const page = Math.max(1, pagination.page || 1);
    const pageSize = Math.max(1, pagination.pageSize || 10);
    const total = await prisma.question.count({ where });

    const items = await prisma.question.findMany({
      where,
      include: { answers: true, questionType: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  return prisma.question.findMany({
    where,
    include: {
      answers: true,
      questionType: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Lấy danh sách loại câu hỏi
 */
export async function getQuestionTypes() {
  return prisma.questionType.findMany({ orderBy: { name: "asc" } });
}

/**
 * Lấy chi tiết câu hỏi (bao gồm answers + questionType)
 * Kiểm tra quyền: chỉ owner (teacher) hoặc admin mới được xem
 */
export async function getQuestionDetail(
  questionId: string,
  teacherId: string,
  isAdmin: boolean = false,
) {
  const q = await prisma.question.findUnique({
    where: { id: questionId },
    include: { answers: true, questionType: true },
  });

  if (!q) throw new Error("Không tìm thấy câu hỏi");

  if (q.teacherId !== teacherId && !isAdmin) {
    throw new Error("Không có quyền");
  }

  return q;
}

/**
 * ✅ Update câu hỏi
 */
export async function updateQuestion(
  questionId: string,
  teacherId: string,
  data: any,
) {
  // ✅ lấy question hiện tại
  const q = await prisma.question.findFirst({
    where: {
      id: questionId,
      teacherId,
    },
  });

  if (!q) throw new Error("Không có quyền");

  const format = data.questionFormat || q.questionFormat;
  const scope = data.scope || q.scope;

  /**
   * ✅ ENFORCE SCOPE
   */
  if (scope === "CHAPTER" && !data.chapterId && !q.chapterId) {
    throw new Error("CHAPTER phải có chapterId");
  }

  if (scope === "SUBJECT" && !data.subjectId && !q.subjectId) {
    throw new Error("SUBJECT phải có subjectId");
  }

  if (scope === "COURSE" && !data.courseId && !q.courseId) {
    throw new Error("COURSE phải có courseId");
  }

  /**
   * ✅ 🔥 SYNC CHAPTER → SUBJECT → COURSE
   * (RẤT QUAN TRỌNG)
   */
  if (data.chapterId && data.chapterId !== q.chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: data.chapterId },
      include: { subject: true },
    });

    if (!chapter) throw new Error("Chapter không tồn tại");

    data.subjectId = chapter.subjectId;
    data.courseId = chapter.subject.courseId;
  }

  /**
   * ✅ ✅ FIX: SUBJECT LOGIC PHẢI ĐỂ NGOÀI
   */
  if (scope === "SUBJECT" && data.subjectId) {
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
    });

    if (!subject) throw new Error("Subject không tồn tại");

    data.courseId = subject.courseId;
    data.chapterId = null; // ✅ đúng logic
  }

  /**
   * ✅ ✅ FIX: COURSE LOGIC PHẢI ĐỂ NGOÀI
   */
  if (scope === "COURSE") {
    data.chapterId = null;
    data.subjectId = null;
  }

  /**
   * ✅ UPDATE QUESTION CORE
   */
  await prisma.question.update({
    where: { id: questionId },
    data: {
      scope,

      chapterId: data.chapterId ?? q.chapterId,
      subjectId: data.subjectId ?? q.subjectId,
      courseId: data.courseId ?? q.courseId,

      content: data.content,
      explanation: data.explanation,
      questionFormat: format,

      difficulty: data.difficulty ?? q.difficulty,
    },
  });

  /**
   * ✅ ESSAY → xoá answers
   */
  if (format === "ESSAY") {
    await prisma.questionAnswer.deleteMany({
      where: { questionId },
    });

    return prisma.question.findUnique({
      where: { id: questionId },
    });
  }

  /**
   * ✅ TRẮC NGHIỆM
   */
  if (data.answers) {
    if (format === "SINGLE_CHOICE") {
      const correctCount = data.answers.filter((a: any) => a.isCorrect).length;

      if (correctCount !== 1) {
        throw new Error("Câu SINGLE phải có đúng 1 đáp án đúng");
      }
    }

    const answersWithOrder = data.answers.map((a: any, i: number) => ({
      questionId,
      answerText: a.answerText,
      isCorrect: a.isCorrect,
      orderIndex: i + 1,
    }));

    await prisma.questionAnswer.deleteMany({
      where: { questionId },
    });

    await prisma.questionAnswer.createMany({
      data: answersWithOrder,
    });
  }

  return prisma.question.findUnique({
    where: { id: questionId },
    include: { answers: true },
  });
}

/**
 * ✅ Delete
 */
export async function deleteQuestion(questionId: string, teacherId: string) {
  const q = await prisma.question.findFirst({
    where: {
      id: questionId,
      teacherId,
    },
  });

  if (!q) throw new Error("Không có quyền");

  // Kiểm tra câu hỏi đã được dùng trong đề thi chưa
  const usedCount = await prisma.testQuestion.count({ where: { questionId } });

  if (usedCount > 0) {
    throw new Error("Câu hỏi đã được dùng trong đề thi, không thể xóa");
  }

  await prisma.question.delete({ where: { id: questionId } });

  return { deleted: true };
}
