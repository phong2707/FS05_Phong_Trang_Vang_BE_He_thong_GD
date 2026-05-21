import models from "@models";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
type SessionStatus = "DRAFT" | "OPEN" | "COMPLETED";

interface CreateSessionPayload {
  sessionDate: string;
  startTime: string;
  endTime: string;
  topic?: string;
  note?: string;
  status?: SessionStatus;
}

interface UpdateRecordsPayload {
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    checkInTime?: string | null;
    note?: string;
  }>;
}

function toDateTimeFromDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function formatDateYYYYMMDD(input: Date): string {
  return input.toISOString().slice(0, 10);
}

function formatTimeHHmm(input: Date): string {
  return input.toISOString().slice(11, 16);
}

async function assertTeacherOwnsSubject(teacherId: string, subjectId: string) {
  const subject = await models.subject.findFirst({
    where: {
      id: subjectId,
      teachers: {
        some: { teacherId },
      },
    },
    select: { id: true },
  });

  if (!subject) {
    return null;
  }

  return subject;
}

async function getPrimaryClassGroupId(subjectId: string): Promise<string | null> {
  const classGroup = await models.classGroup.findFirst({
    where: { subjectId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return classGroup?.id ?? null;
}

function mapSessionStatusByTime(startAt: Date, endAt: Date): SessionStatus {
  const now = new Date();
  if (now < startAt) return "DRAFT";
  if (now >= startAt && now <= endAt) return "OPEN";
  return "COMPLETED";
}

function isCompletedByTopic(topic?: string | null): boolean {
  if (!topic) return false;
  return topic.startsWith("[COMPLETED]");
}

function markTopicCompleted(topic?: string | null): string {
  const raw = (topic || "").trim();
  if (!raw) return "[COMPLETED] Buổi học";
  if (raw.startsWith("[COMPLETED]")) return raw;
  return `[COMPLETED] ${raw}`;
}

function unmarkTopicCompleted(topic?: string | null): string {
  if (!topic) return "";
  return topic.replace(/^\[COMPLETED\]\s*/i, "").trim();
}

async function computeSessionCounts(scheduleId: string) {
  const records = await models.attendance.findMany({
    where: { scheduleId },
    select: { status: true },
  });

  const totalStudents = records.length;
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const excusedCount = records.filter((r) => r.status === "EXCUSED").length;

  return { totalStudents, presentCount, absentCount, lateCount, excusedCount };
}

export async function getTeacherSubjectAttendanceSessions(teacherId: string, subjectId: string) {
  const owned = await assertTeacherOwnsSubject(teacherId, subjectId);
  if (!owned) return null;

  const schedules = await models.schedule.findMany({
    where: {
      teacherId,
      classGroup: {
        subjectId,
      },
    },
    orderBy: { startAt: "desc" },
    select: {
      id: true,
      classGroupId: true,
      teacherId: true,
      title: true,
      description: true,
      startAt: true,
      endAt: true,
      createdAt: true,
    },
  });

  const mapped = await Promise.all(
    schedules.map(async (s) => {
      const counts = await computeSessionCounts(s.id);
      return {
        id: s.id,
        subjectId,
        sessionDate: formatDateYYYYMMDD(s.startAt),
        startTime: formatTimeHHmm(s.startAt),
        endTime: formatTimeHHmm(s.endAt),
        topic: unmarkTopicCompleted(s.title || ""),
        note: s.description || "",
        status: isCompletedByTopic(s.title) ? "COMPLETED" : mapSessionStatusByTime(s.startAt, s.endAt),
        totalStudents: counts.totalStudents,
        presentCount: counts.presentCount,
        absentCount: counts.absentCount,
        lateCount: counts.lateCount,
        excusedCount: counts.excusedCount,
        createdAt: s.createdAt.toISOString(),
      };
    })
  );

  return mapped;
}

export async function getTeacherSubjectAttendanceStats(teacherId: string, subjectId: string) {
  const sessions = await getTeacherSubjectAttendanceSessions(teacherId, subjectId);
  if (!sessions) return null;

  const totalSessions = sessions.length;
  const averageAttendanceRate =
    totalSessions === 0
      ? 0
      : Math.round(
          sessions.reduce((acc, s) => {
            if (!s.totalStudents) return acc;
            return acc + ((s.presentCount + s.lateCount + s.excusedCount) / s.totalStudents) * 100;
          }, 0) / totalSessions
        );

  const today = new Date().toISOString().slice(0, 10);
  const todaySession = sessions.find((s) => s.sessionDate === today);

  return {
    totalSessions,
    averageAttendanceRate,
    todayPresent: todaySession?.presentCount ?? 0,
    todayAbsent: todaySession?.absentCount ?? 0,
  };
}

export async function getTeacherSessionAttendanceRecords(teacherId: string, subjectId: string, sessionId: string) {
  const owned = await assertTeacherOwnsSubject(teacherId, subjectId);
  if (!owned) return null;

  const schedule = await models.schedule.findFirst({
    where: {
      id: sessionId,
      teacherId,
      classGroup: { subjectId },
    },
    select: { id: true, classGroupId: true },
  });

  if (!schedule) return [];

  const classStudents = await models.classGroupUser.findMany({
    where: {
      classGroupId: schedule.classGroupId,
      role: "STUDENT",
    },
    select: {
      userId: true,
      user: {
        select: {
          email: true,
          firstName: true,
          middleName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  const attendanceRecords = await models.attendance.findMany({
    where: {
      scheduleId: sessionId,
    },
    select: {
      id: true,
      studentId: true,
      status: true,
      note: true,
      createdAt: true,
    },
  });

  const attendanceMap = new Map(attendanceRecords.map((a) => [a.studentId, a]));

  return classStudents.map((stu, idx) => {
    const found = attendanceMap.get(stu.userId);
    const fullName = [stu.user.lastName, stu.user.middleName, stu.user.firstName].filter(Boolean).join(" ").trim();
    return {
      id: found?.id ?? `${sessionId}-${stu.userId}`,
      sessionId,
      studentId: stu.userId,
      studentCode: `SV${String(idx + 1).padStart(3, "0")}`,
      studentName: fullName || `Sinh viên ${idx + 1}`,
      email: stu.user.email,
      status: (found?.status as AttendanceStatus) ?? "ABSENT",
      checkInTime: found?.status === "PRESENT" || found?.status === "LATE" ? formatTimeHHmm(found.createdAt) : undefined,
      note: found?.note ?? "",
    };
  });
}

export async function createTeacherAttendanceSession(
  teacherId: string,
  subjectId: string,
  payload: CreateSessionPayload
) {
  const owned = await assertTeacherOwnsSubject(teacherId, subjectId);
  if (!owned) return null;

  const classGroupId = await getPrimaryClassGroupId(subjectId);
  if (!classGroupId) return null;

  const startAt = toDateTimeFromDateAndTime(payload.sessionDate, payload.startTime);
  const endAt = toDateTimeFromDateAndTime(payload.sessionDate, payload.endTime);

  const created = await models.schedule.create({
    data: {
      classGroupId,
      teacherId,
      title: payload.status === "COMPLETED" ? markTopicCompleted(payload.topic) : (payload.topic?.trim() || "Buổi học"),
      description: payload.note?.trim() || null,
      startAt,
      endAt,
      dayOfWeek: startAt.getDay(),
    },
    select: {
      id: true,
      createdAt: true,
      startAt: true,
      endAt: true,
      title: true,
      description: true,
    },
  });

  return {
    id: created.id,
    subjectId,
    sessionDate: formatDateYYYYMMDD(created.startAt),
    startTime: formatTimeHHmm(created.startAt),
    endTime: formatTimeHHmm(created.endAt),
    topic: unmarkTopicCompleted(created.title || ""),
    note: created.description || "",
    status: isCompletedByTopic(created.title)
      ? "COMPLETED"
      : payload.status ?? mapSessionStatusByTime(created.startAt, created.endAt),
    totalStudents: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function updateTeacherSessionAttendanceRecords(
  teacherId: string,
  subjectId: string,
  sessionId: string,
  payload: UpdateRecordsPayload
) {
  const owned = await assertTeacherOwnsSubject(teacherId, subjectId);
  if (!owned) return null;

  const schedule = await models.schedule.findFirst({
    where: {
      id: sessionId,
      teacherId,
      classGroup: { subjectId },
    },
    select: { id: true, title: true },
  });

  if (!schedule) return null;

  if (isCompletedByTopic(schedule.title)) {
    return { success: false, reason: "SESSION_COMPLETED" as const };
  }

  await models.$transaction(
    payload.records.map((record) =>
      models.attendance.upsert({
        where: {
          scheduleId_studentId: {
            scheduleId: sessionId,
            studentId: record.studentId,
          },
        },
        update: {
          status: record.status,
          note: record.note || null,
        },
        create: {
          scheduleId: sessionId,
          studentId: record.studentId,
          status: record.status,
          note: record.note || null,
        },
      })
    )
  );

  return { success: true };
}

export async function completeTeacherAttendanceSession(teacherId: string, subjectId: string, sessionId: string) {
  const owned = await assertTeacherOwnsSubject(teacherId, subjectId);
  if (!owned) return null;

  const schedule = await models.schedule.findFirst({
    where: {
      id: sessionId,
      teacherId,
      classGroup: { subjectId },
    },
    select: { id: true, title: true },
  });

  if (!schedule) return null;

  const updated = await models.schedule.update({
    where: { id: schedule.id },
    data: {
      title: markTopicCompleted(schedule.title),
    },
    select: { id: true, title: true },
  });

  return {
    id: updated.id,
    status: "COMPLETED" as SessionStatus,
  };
}
