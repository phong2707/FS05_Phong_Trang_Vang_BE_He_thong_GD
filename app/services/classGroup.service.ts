import models from "@models";
import { ApplicationService } from "./application.service";
import { randomUUID } from "crypto";

export class ClassGroupService extends ApplicationService {
  private async getSubjectOrThrow(subjectId: string) {
    const subject = await models.subject.findUnique({
      where: { id: subjectId },
      include: { course: true },
    });

    if (!subject) throw new Error("Không tìm thấy môn học");
    return subject;
  }

  private async getCourseMaxStudentsRule(courseId: string) {
    return models.courseRule.findFirst({
      where: {
        courseId,
        ruleCode: "MAX_STUDENTS",
        isActive: true,
      },
    });
  }

  private async ensureMaxStudentsByRule(courseId: string, maxStudents?: number | null) {
    if (maxStudents == null) return;
    const rule = await this.getCourseMaxStudentsRule(courseId);
    if (!rule) return;

    const ruleValue = Number(rule.ruleValue);
    if (!Number.isNaN(ruleValue) && maxStudents > ruleValue) {
      throw new Error(`Sĩ số tối đa không được vượt quá ${ruleValue} theo quy định khóa học`);
    }
  }

  async findAll(query: any) {
    const page = Math.max(Number(query?.page || 1), 1);
    const limit = Math.max(Number(query?.limit || 20), 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.subjectId) where.subjectId = query.subjectId;
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.name = { contains: query.search };
    }

    const [items, total] = await Promise.all([
      models.classGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          subject: {
            include: { course: { select: { id: true, title: true } } },
          },
          _count: { select: { groupUsers: true } },
        },
      }),
      models.classGroup.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const group = await models.classGroup.findUnique({
      where: { id },
      include: {
        subject: { include: { course: true } },
        groupUsers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        schedules: true,
        _count: { select: { groupUsers: true } },
      },
    });

    if (!group) throw new Error("Không tìm thấy nhóm lớp");
    return group;
  }

  async createClassGroup(dto: any) {
    const { subjectId, name, startDate, endDate, maxStudents, roomLink, status } = dto || {};
    if (!subjectId || !name) {
      throw new Error("subjectId và name là bắt buộc");
    }

    const subject = await this.getSubjectOrThrow(subjectId);
    await this.ensureMaxStudentsByRule(subject.courseId, maxStudents);

    const id = randomUUID();
    await models.classGroup.create({
      data: {
        id,
        subjectId,
        name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxStudents: maxStudents ?? 30,
        roomLink: roomLink ?? null,
        status: status ?? "ACTIVE",
      },
    });

    return this.findOne(id);
  }

  async updateClassGroup(id: string, dto: any) {
    if (!id) throw new Error("id là bắt buộc");

    const existing = await models.classGroup.findUnique({
      where: { id },
      include: { subject: true, _count: { select: { groupUsers: true } } },
    });
    if (!existing) throw new Error("Không tìm thấy nhóm lớp");

    const nextMaxStudents = dto?.maxStudents ?? existing.maxStudents ?? 30;
    await this.ensureMaxStudentsByRule(existing.subject.courseId, nextMaxStudents);

    if (nextMaxStudents != null && existing._count.groupUsers > nextMaxStudents) {
      throw new Error("Sĩ số mới nhỏ hơn số lượng sinh viên hiện tại trong lớp");
    }

    await models.classGroup.update({
      where: { id },
      data: {
        subjectId: dto?.subjectId ?? existing.subjectId,
        name: dto?.name ?? existing.name,
        startDate: dto?.startDate ? new Date(dto.startDate) : dto?.startDate === null ? null : existing.startDate,
        endDate: dto?.endDate ? new Date(dto.endDate) : dto?.endDate === null ? null : existing.endDate,
        maxStudents: dto?.maxStudents ?? existing.maxStudents,
        roomLink: dto?.roomLink ?? existing.roomLink,
        status: dto?.status ?? existing.status,
      },
    });

    return this.findOne(id);
  }

  async deactivate(id: string) {
    const existing = await models.classGroup.findUnique({ where: { id } });
    if (!existing) throw new Error("Không tìm thấy nhóm lớp");

    await models.classGroup.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    return this.findOne(id);
  }

  async getStudents(classGroupId: string) {
    const group = await models.classGroup.findUnique({ where: { id: classGroupId } });
    if (!group) throw new Error("Không tìm thấy nhóm lớp");

    return models.classGroupUser.findMany({
      where: { classGroupId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
  }

  async addStudents(classGroupId: string, dto: { userIds: string[] }) {
    const group = await models.classGroup.findUnique({
      where: { id: classGroupId },
      include: {
        subject: { include: { course: true } },
        _count: { select: { groupUsers: true } },
      },
    });
    if (!group) throw new Error("Không tìm thấy nhóm lớp");

    const maxStudents = group.maxStudents ?? 30;
    let currentCount = group._count.groupUsers;

    const added: string[] = [];
    const failed: { userId: string; reason: string }[] = [];

    for (const userId of dto.userIds || []) {
      if (currentCount >= maxStudents) {
        throw new Error("Lớp đã đầy, không thể thêm sinh viên");
      }

      const enrollment = await models.courseEnrollment.findFirst({
        where: {
          userId,
          courseId: group.subject.courseId,
          status: "ACTIVE",
        },
      });
      if (!enrollment) {
        failed.push({ userId, reason: "Sinh viên chưa ghi danh ACTIVE trong khóa học" });
        continue;
      }

      const inAnotherGroupSameSubject = await models.classGroupUser.findFirst({
        where: {
          userId,
          classGroup: {
            subjectId: group.subjectId,
            id: { not: classGroupId },
          },
        },
      });
      if (inAnotherGroupSameSubject) {
        failed.push({ userId, reason: "Sinh viên đã thuộc lớp khác của cùng môn học" });
        continue;
      }

      const alreadyInGroup = await models.classGroupUser.findUnique({
        where: {
          userId_classGroupId: { userId, classGroupId },
        },
      });
      if (alreadyInGroup) {
        failed.push({ userId, reason: "Sinh viên đã có trong lớp" });
        continue;
      }

      await models.classGroupUser.create({
        data: {
          userId,
          classGroupId,
          role: "STUDENT",
        },
      });

      currentCount += 1;
      added.push(userId);
    }

    return { added, failed };
  }

  async removeStudent(classGroupId: string, userId: string) {
    const existing = await models.classGroupUser.findUnique({
      where: {
        userId_classGroupId: { userId, classGroupId },
      },
    });

    if (!existing) {
      throw new Error("Sinh viên không có trong lớp");
    }

    await models.classGroupUser.delete({
      where: {
        userId_classGroupId: { userId, classGroupId },
      },
    });

    return { removed: true };
  }

  async getAvailableTeachers(classGroupId: string) {
    const group = await models.classGroup.findUnique({
      where: { id: classGroupId },
      select: { subjectId: true },
    });

    if (!group) throw new Error("Không tìm thấy nhóm lớp");

    return models.subjectTeacher.findMany({
      where: { subjectId: group.subjectId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async list() {
    return this.findAll({});
  }
}
