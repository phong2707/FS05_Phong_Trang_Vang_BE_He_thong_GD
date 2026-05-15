import { Prisma } from "@db";
import models from "@models";
import { AdminController } from "./admin.controller";

export class AdminCourseController extends AdminController {
  // 0. LẤY DANH SÁCH GIÁO VIÊN
  async getTeachers() {
    try {
      const teachers = await models.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                code: "TEACHER"
              }
            }
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true  
        },
        orderBy: { firstName: "asc" }
      });

      return this.res.json(teachers);
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 1. LẤY DANH SÁCH TẤT CẢ KHÓA HỌC
  async getAllCourses() {
    try {
      const courses = await models.course.findMany({
        where: { status: { not: "ARCHIVED" } },
        include: {
          admin: { select: { id: true, firstName: true, lastName: true } },
          subjects: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      const coursesWithStats = courses.map(course => ({
        ...course,
        subjectCount: course.subjects.length
      }));

      return this.res.json(coursesWithStats);
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. TẠO KHÓA HỌC MỚI VỚI SUBJECTS VÀ TEACHERS
  async createCourse() {
    try {
      const adminId = this.req.user?.id;
      if (!adminId) {
        return this.res.status(401).json({ success: false, message: "Không xác định Admin" });
      }

      const {
        title,
        description,
        price,
        thumbnailUrl,
        subjects,
        startDate,
        endDate,
        durationValue,
        durationUnit,
        daysOfWeek,
        level,
        maxStudents,
        language,
        isFeatured,
        discountPrice
      } = this.req.body;

      if (!title || !price || !Array.isArray(subjects)) {
        return this.res.status(400).json({ 
          success: false, 
          message: "Title, price, và subjects là bắt buộc" 
        });
      }

      // Sử dụng Transaction để tạo Course + Subjects + SubjectTeachers trong một lần
      const course = await models.course.create({
        data: {
          title,
          description: description || "",
          price: parseFloat(price as any),
          thumbnailUrl: thumbnailUrl || null,
          status: "DRAFT",
          adminId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          durationValue: durationValue !== undefined ? parseInt(durationValue as any, 10) : undefined,
          durationUnit: durationUnit || undefined,
          daysOfWeek: daysOfWeek || undefined,
          level: level || undefined,
          maxStudents: maxStudents !== undefined ? parseInt(maxStudents as any, 10) : undefined,
          language: language || undefined,
          isFeatured: typeof isFeatured === 'boolean' ? isFeatured : undefined,
          discountPrice: discountPrice !== undefined ? parseFloat(discountPrice as any) : undefined,
          subjects: {
            create: subjects.map((subject: any, index: number) => ({
              name: subject.name,
              description: subject.description || "",
              sortOrder: index,
              teachers: {
                create: [
                  ...(subject.mainTeacher ? [{
                    teacherId: subject.mainTeacher,
                    type: "MAIN"
                  }] : []),
                  ...(subject.assistantTeacher ? [{
                    teacherId: subject.assistantTeacher,
                    type: "TA"
                  }] : [])
                ]
              }
            }))
          }
        },
        include: {
          subjects: {
            include: {
              teachers: {
                include: {
                  teacher: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          },
          admin: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      return this.res.json({ 
        success: true, 
        message: "Tạo khóa học thành công", 
        data: course 
      });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. LẤY CHI TIẾT KHÓA HỌC
  async getCourseDetail() {
    try {
      const { id } = this.req.params;
      const course = await models.course.findUnique({
        where: { id },
        include: {
          subjects: {
            include: {
              teachers: {
                include: {
                  teacher: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          },
          admin: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      if (!course) {
        return this.res.status(404).json({ success: false, message: "Khóa học không tìm thấy" });
      }

      return this.res.json(course);
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 4. CẬP NHẬT KHÓA HỌC
  async updateCourse() {
    try {
      const { id } = this.req.params;
      const {
        title,
        description,
        price,
        thumbnailUrl,
        status,
        startDate,
        endDate,
        durationValue,
        durationUnit,
        daysOfWeek,
        level,
        maxStudents,
        language,
        isFeatured,
        discountPrice
      } = this.req.body;

      const course = await models.course.update({
        where: { id },
        data: {
          title: title || undefined,
          description: description || undefined,
          price: price ? parseFloat(price as any) : undefined,
          thumbnailUrl: thumbnailUrl || undefined,
          status: status || undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          durationValue: durationValue !== undefined ? parseInt(durationValue as any, 10) : undefined,
          durationUnit: durationUnit || undefined,
          daysOfWeek: daysOfWeek || undefined,
          level: level || undefined,
          maxStudents: maxStudents !== undefined ? parseInt(maxStudents as any, 10) : undefined,
          language: language || undefined,
          isFeatured: typeof isFeatured === 'boolean' ? isFeatured : undefined,
          discountPrice: discountPrice !== undefined ? parseFloat(discountPrice as any) : undefined
        },
        include: {
          subjects: {
            include: {
              teachers: {
                include: {
                  teacher: {
                    select: { id: true, firstName: true, lastName: true }
                  }
                }
              }
            }
          }
        }
      });

      return this.res.json({ 
        success: true, 
        message: "Cập nhật khóa học thành công", 
        data: course 
      });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }
}
