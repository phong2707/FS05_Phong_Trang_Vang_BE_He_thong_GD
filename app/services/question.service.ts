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
  let subjectId: string | null = data.subjectId || null;

  /**
   * ✅ CASE CHAPTER
   */
  if (data.chapterId) {
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: data.chapterId,
        subject: {
          teachers: {
            some: { teacherId },
          },
        },
      },
    });

    if (!chapter) {
      throw new Error("Không có quyền tạo câu hỏi cho chương này");
    }

    subjectId = chapter.subjectId;
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

    subjectId = subject.id;
  }

  if (!subjectId) {
    throw new Error("Không xác định được môn học (subjectId) cho câu hỏi");
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
        subjectId: subjectId,
        teacherId,
        typeId: data.typeId,
        questionFormat: "ESSAY",
        content: data.content,
        explanation: data.explanation,
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
      subjectId: subjectId,
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
  params: {
    chapterId?: string;
    subjectId?: string;
    courseId?: string;
  },
  teacherId: string,
) {
  let subjectIds: string[] = [];

  if (params.chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: params.chapterId },
    });
    if (chapter) subjectIds.push(chapter.subjectId);
  } else if (params.subjectId) {
    subjectIds.push(params.subjectId);
  } else if (params.courseId) {
    const subjects = await prisma.subject.findMany({
      where: { courseId: params.courseId },
    });
    subjectIds = subjects.map((s) => s.id);
  }

  const whereClause: any = { teacherId };
  if (subjectIds.length > 0) {
    whereClause.subjectId = { in: subjectIds };
  }

  return prisma.question.findMany({
    where: whereClause,
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
  let newSubjectId = q.subjectId;

  if (data.chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: data.chapterId },
    });
    if (!chapter) throw new Error("Chapter không tồn tại");
    newSubjectId = chapter.subjectId;
  } else if (data.subjectId) {
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
    });
    if (!subject) throw new Error("Subject không tồn tại");
    newSubjectId = subject.id;
  } else if (data.courseId) {
    const subject = await prisma.subject.findFirst({
      where: { courseId: data.courseId, teachers: { some: { teacherId } } },
    });
    if (!subject) throw new Error("Không tìm thấy môn học phù hợp trong khóa");
    newSubjectId = subject.id;
  }

  /**
   * ✅ UPDATE QUESTION CORE
   */
  await prisma.question.update({
    where: { id: questionId },
    data: {
      subjectId: newSubjectId,
      content: data.content,
      explanation: data.explanation,
      questionFormat: format,
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

  await prisma.question.delete({
    where: { id: questionId },
  });

  return { deleted: true };
}
