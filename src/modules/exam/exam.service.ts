import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { CreateExamDto, UpdateExamDto } from "./dto/create-exam.dto";

@Injectable()
export class ExamService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateExamDto, currentUser: any) {
        const group = await this.prisma.group.findFirst({
            where: { id: dto.group_id },
            select: { id: true }
        });
        if (!group) throw new NotFoundException("Guruh topilmadi");

        const studentCount = await this.prisma.studentGroup.count({
            where: { group_id: dto.group_id, status: "active" }
        });

        const exam = await this.prisma.exam.create({
            data: {
                group_id: dto.group_id,
                topic: dto.topic,
                description: dto.description || null,
                lesson_id: dto.lesson_id || null,
                teacher_id: currentUser.role === 'TEACHER' ? currentUser.id : null,
                deadline_date: dto.deadline_date ? new Date(dto.deadline_date) : null,
                deadline_time: dto.deadline_time || null,
                announced_at: new Date(),
                student_count: studentCount,
                fail_count: 0
            }
        });
        return { success: true, message: "Imtihon yaratildi", data: exam };
    }

    async findByGroup(groupId: number) {
        const exams = await this.prisma.exam.findMany({
            where: { group_id: groupId },
            include: {
                lessons: { select: { topic: true } },
                teachers: { select: { full_name: true } },
                groups: {
                    select: {
                        name: true,
                        rooms: { select: { name: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Get student count for each exam's group
        const studentCount = await this.prisma.studentGroup.count({
            where: { group_id: groupId, status: 'active' }
        });

        const data = exams.map((exam, index) => ({
            ...exam,
            order: exams.length - index,
            student_count: studentCount,
            lesson_topic: exam.lessons?.topic || 'Examination',
            group_name: exam.groups?.name,
            room_name: exam.groups?.rooms?.name
        }));

        return { success: true, data };
    }

    async findOne(id: number) {
        const exam = await this.prisma.exam.findUnique({
            where: { id },
            include: {
                lessons: { select: { topic: true } },
                teachers: { select: { full_name: true } },
                groups: {
                    select: {
                        name: true,
                        rooms: { select: { name: true } }
                    }
                }
            }
        });
        if (!exam) throw new NotFoundException("Imtihon topilmadi");
        return { success: true, data: exam };
    }

    async remove(id: number) {
        const exam = await this.prisma.exam.findUnique({ where: { id } });
        if (!exam) throw new NotFoundException("Imtihon topilmadi");
        await this.prisma.exam.delete({ where: { id } });
        return { success: true, message: "Imtihon o'chirildi" };
    }

    async update(id: number, dto: UpdateExamDto) {
        const exam = await this.prisma.exam.findUnique({ where: { id } });
        if (!exam) throw new NotFoundException("Imtihon topilmadi");

        const updateData: any = {};
        if (dto.group_id !== undefined) updateData.group_id = dto.group_id;
        if (dto.topic !== undefined) updateData.topic = dto.topic;
        if (dto.description !== undefined) updateData.description = dto.description || null;
        if (dto.lesson_id !== undefined) updateData.lesson_id = dto.lesson_id || null;
        if (dto.deadline_date !== undefined) {
            updateData.deadline_date = dto.deadline_date ? new Date(dto.deadline_date) : null;
        }
        if (dto.deadline_time !== undefined) updateData.deadline_time = dto.deadline_time || null;

        const updated = await this.prisma.exam.update({
            where: { id },
            data: updateData
        });

        return { success: true, message: "Imtihon yangilandi", data: updated };
    }

    async updateStatus(id: number, status: string) {
        const exam = await this.prisma.exam.findUnique({ where: { id } });
        if (!exam) throw new NotFoundException("Imtihon topilmadi");
        const updated = await this.prisma.exam.update({
            where: { id },
            data: { status: status as any }
        });
        return { success: true, data: updated };
    }
}
