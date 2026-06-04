import { Prisma } from "@db";

import models from "@models";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

// ✅ shuffle answers (client-side OK)
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    // swap
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result;
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

  // ✅ 1. RESOLVE SCOPE
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

  // ✅ 2. BUILD WHERE SQL (RAW)
  function buildScopeCondition(): Prisma.Sql {
  if (scope === "CHAPTER") {
    return Prisma.sql`(chapter_id = ${data.chapterId} OR subject_id = ${subjectId} OR course_id = ${courseId})`;
  }
  if (scope === "SUBJECT") {
    return Prisma.sql`(subject_id = ${subjectId} OR course_id = ${courseId})`;
  }
  if (scope === "COURSE") {
    return Prisma.sql`(course_id = ${courseId})`;
  }
  return Prisma.sql`1=1`;
}

const scopeCondition = buildScopeCondition();

  // ✅ 3. FUNCTION RANDOM THEO DIFFICULTY (DB LEVEL)
  async function getRandomQuestions(
  difficulty: "EASY" | "MEDIUM" | "HARD",
  limit: number
) {
  if (!limit || limit <= 0) return [];

  // $queryRaw kết hợp Prisma.raw cho scopeCondition và binding cho difficulty/limit
  const questions = await prisma.$queryRaw<any[]>`
    SELECT id
    FROM questions
    WHERE ${scopeCondition}
      AND difficulty = ${difficulty}
      AND question_format = 'SINGLE_CHOICE'
    ORDER BY RANDOM()
    LIMIT ${limit}
  `;

  return questions;
}
  // ✅ 4. LẤY QUESTION SONG SONG
  const [easyQs, mediumQs, hardQs] = await Promise.all([
    getRandomQuestions("EASY", rule.easy || 0),
    getRandomQuestions("MEDIUM", rule.medium || 0),
    getRandomQuestions("HARD", rule.hard || 0),
  ]);

  const allQuestions = [...easyQs, ...mediumQs, ...hardQs];

  if (allQuestions.length === 0) {
    throw new Error("Không đủ câu hỏi trong ngân hàng");
  }

  // ✅ 5. LOAD ANSWERS (Prisma cho tiện)
  const questionIds = allQuestions.map(q => q.id);

  const fullQuestions = await prisma.question.findMany({
    where: {
      id: { in: questionIds },
    },
    include: {
      answers: true,
    },
  });

  // ✅ 6. MAP lại đúng order + shuffle answers
  const map = new Map(fullQuestions.map(q => [q.id, q]));

  const finalQuestions = shuffleArray(
    allQuestions.map(q => {
      const full = map.get(q.id);

      return {
        ...full,
        answers: shuffleArray(full!.answers).map(a => ({
          id: a.id,
          answerText: a.answerText,
        })),
      };
    })
  );

  return finalQuestions;
}
