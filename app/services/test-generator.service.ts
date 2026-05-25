import models from "@models";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

// ✅ SHUFFLE
function shuffleArray<T>(arr: T[]): T[] {
  return arr.sort(() => Math.random() - 0.5);
}

export async function generateTestAutomatically(
  data: {
    scope: "CHAPTER" | "SUBJECT" | "COURSE";

    chapterId?: string;
    subjectId?: string;
    courseId?: string;

    rule: {
      easy?: number;
      medium?: number;
      hard?: number;
    };
  }
) {
  const { scope, rule } = data;

  /**
   * ✅ RESOLVE SCOPE ROOT
   */
  let subjectId: string | null = null;
  let courseId: string | null = null;

  if (scope === "CHAPTER") {
    const chapter = await prisma.chapter.findUnique({
      where: { id: data.chapterId! },
      include: { subject: true },
    });

    if (!chapter) throw new Error("Chapter không tồn tại");

    subjectId = chapter.subjectId;
    courseId = chapter.subject.courseId;
  }

  if (scope === "SUBJECT") {
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId! },
    });

    if (!subject) throw new Error("Subject không tồn tại");

    subjectId = subject.id;
    courseId = subject.courseId;
  }

  if (scope === "COURSE") {
    courseId = data.courseId!;
  }

  /**
   * ✅ BUILD QUERY BASE
   */
  const baseWhere: any = {};

  if (scope === "CHAPTER") {
    baseWhere.OR = [
      { chapterId: data.chapterId },
      { subjectId },
      { courseId },
    ];
  }

  if (scope === "SUBJECT") {
    baseWhere.OR = [
      { subjectId },
      { courseId },
    ];
  }

  if (scope === "COURSE") {
    baseWhere.courseId = courseId;
  }

  /**
   * ✅ FUNCTION LẤY CÂU THEO DIFFICULTY
   */
  async function getQuestions(
    difficulty: string,
    limit: number
  ) {
    if (!limit || limit <= 0) return [];

    const questions = await prisma.question.findMany({
      where: {
        ...baseWhere,
        difficulty: difficulty.toUpperCase(),
        questionFormat: "SINGLE_CHOICE",
      },
      take: limit * 3, // 🔥 lấy dư để random
      include: {
        answers: true,
      },
    });

    return shuffleArray(questions).slice(0, limit);
  }

  /**
   * ✅ RANDOM THEO RULE
   */
  const easyQs = await getQuestions("EASY", rule.easy || 0);
  const mediumQs = await getQuestions("MEDIUM", rule.medium || 0);
  const hardQs = await getQuestions("HARD", rule.hard || 0);

  /**
   * ✅ MERGE + SHUFFLE
   */
  const finalQuestions = shuffleArray([
    ...easyQs,
    ...mediumQs,
    ...hardQs,
  ]);

  /**
   * ✅ SHUFFLE ANSWERS
   */
  const result = finalQuestions.map(q => ({
  ...q,
  answers: shuffleArray(q.answers).map(a => ({
    id: a.id,
    answerText: a.answerText,
  })),
}));
  return result;
}

export async function generateAdaptiveQuestion(
  lastResult: "CORRECT" | "WRONG",
  scopeData: any
) {
  let difficulty = "MEDIUM";

  if (lastResult === "CORRECT") difficulty = "HARD";
  if (lastResult === "WRONG") difficulty = "EASY";

  const questions = await prisma.question.findMany({
    where: {
      ...scopeData,
      difficulty,
    },
    take: 10,
  });

  return shuffleArray(questions)[0];
}