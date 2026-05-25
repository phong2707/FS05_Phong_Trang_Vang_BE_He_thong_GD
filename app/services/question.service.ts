import models from "@models";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

/**
 * ✅ Tạo câu hỏi
 */
export async function createQuestion(
  teacherId: string,
  data: {
    subjectId: string;
    typeId: string;
    content: string;
    explanation?: string;
    questionFormat?: string;
    answers?: {
      answerText: string;
      isCorrect: boolean;
      orderIndex: number;
    }[];
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
    throw new Error("Bạn không có quyền tạo câu hỏi cho môn này");
  }

  if (!data.content?.trim()) {
    throw new Error("Nội dung câu hỏi không hợp lệ");
  }

  // ✅ default format
  const format = data.questionFormat || "SINGLE_CHOICE";

  /**
   * ✅ ESSAY (TỰ LUẬN - WYSIWYG)
   */
  if (format === "ESSAY") {
    return prisma.question.create({
      data: {
        subjectId: data.subjectId,
        teacherId,
        typeId: data.typeId,
        questionFormat: "ESSAY",
        content: data.content,        // đề bài (HTML)
        explanation: data.explanation // ✅ đáp án mẫu (HTML)
      },
    });
  }

  /**
   * ✅ TRẮC NGHIỆM
   */
  if (!data.answers || data.answers.length === 0) {
    throw new Error("Câu hỏi phải có đáp án");
  }

  // ✅ validate SINGLE
  if (format === "SINGLE_CHOICE") {
    const correctCount = data.answers.filter(a => a.isCorrect).length;

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
      subjectId: data.subjectId,
      teacherId,
      typeId: data.typeId,
      questionFormat: format,
      content: data.content,
      explanation: data.explanation,
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
  subjectId: string,
  teacherId: string,
  filter?: {
    questionFormat?: string;
    typeId?: string;
    search?: string;
  },
  pagination?: { page: number; pageSize: number }
) {
  const where: any = {
    subjectId,
    subject: {
      teachers: {
        some: { teacherId }
      }
    }
  };

  if (filter) {
    if (filter.questionFormat) where.questionFormat = filter.questionFormat;
    if (filter.typeId) where.typeId = filter.typeId;
    if (filter.search) where.content = { contains: filter.search };
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
  isAdmin: boolean = false
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
  data: any
) {
  const q = await prisma.question.findFirst({
    where: {
      id: questionId,
      teacherId,
    },
  });

  if (!q) throw new Error("Không có quyền");

  const format = data.questionFormat || q.questionFormat;

  await prisma.question.update({
    where: { id: questionId },
    data: {
      content: data.content,
      explanation: data.explanation,
      questionFormat: format,
    },
  });

  /**
   * ✅ ESSAY → không cần answers
   */
  if (format === "ESSAY") {
    // ✅ xóa hết đáp án cũ nếu có
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
export async function deleteQuestion(
  questionId: string,
  teacherId: string
) {
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