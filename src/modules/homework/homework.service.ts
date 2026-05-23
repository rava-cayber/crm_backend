import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateHomeworkDto } from './dto/create.dto';
import { Role } from '@prisma/client';

@Injectable()
export class HomeworkService {
    constructor(private prisma: PrismaService) { }

    async getOwnHomework(lessonId: number, currentUser?: { id: number }) {
        const myLessons = await this.prisma.homework.findMany({
            where: {
                lesson_id: lessonId
            },
            select: {
                id: true,
                title: true,
                file: true,
                created_at: true,
                update_at: true,
                teachers: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                        photo: true
                    }
                },
                users: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        phone: true,
                        photo: true
                    }
                }
            }
        })

        const homeworkFormated = myLessons.map(el => {
            if (!el.teachers) {
                return {
                    id: el.id,
                    title: el.title,
                    file: el.file,
                    created_at: el.created_at,
                    update_at: el.update_at,
                    user: el.users
                }
            } else {
                return {
                    id: el.id,
                    title: el.title,
                    file: el.file,
                    created_at: el.created_at,
                    update_at: el.update_at,
                    teacher: el.teachers
                }
            }
        })

        return {
            success: true,
            data: homeworkFormated
        }
    }

    async getAllHomework() {
        const homeworks = await this.prisma.homework.findMany()

        return {
            success: true,
            data: homeworks
        }
    }

    async createHomework(payload: CreateHomeworkDto, currentUser: { id: number, role: Role }, filename?: string) {
        const existLesson = await this.prisma.lesson.findFirst({
            where: {
                id: payload.lesson_id
            },
            select: {
                groups: {
                    select: {
                        teacher_id: true
                    }
                }
            }
        })

        if (!existLesson) {
            throw new NotFoundException("Lesson not fount with this id")
        }

        if (currentUser.role == Role.TEACHER && existLesson.groups.teacher_id != currentUser.id) {
            throw new ForbiddenException("Is not your lesson")
        }

        await this.prisma.homework.create({
            data: {
                ...payload,
                file: filename,
                teacher_id: currentUser.role == "TEACHER" ? currentUser.id : null,
                user_id: currentUser.role != "TEACHER" ? currentUser.id : null
            }
        })

        return {
            success: true,
            message: "Homework recorded"
        }
    }

    async submitHomeworkAnswer(homeworkId: number, title: string, userId: number, filename?: string) {
        const existHomework = await this.prisma.homework.findUnique({
            where: { id: homeworkId }
        });
        if (!existHomework) {
            throw new NotFoundException("Homework not found");
        }

        // Resolve actual Student ID by finding a Student with the same phone or email as the User
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        let resolvedStudentId = userId;
        if (user) {
            const student = await this.prisma.student.findFirst({
                where: {
                    OR: [
                        { phone: user.phone },
                        { email: user.email }
                    ]
                }
            });
            if (student) {
                resolvedStudentId = student.id;
            }
        }

        const answer = await this.prisma.homeworkAnswerStudent.create({
            data: {
                homework_id: homeworkId,
                student_id: resolvedStudentId,
                title: title,
                file: filename
            }
        });
        return {
            success: true,
            message: "Homework answer submitted successfully",
            data: answer
        };
    }

    async getHomeworkAnswers(homeworkId: number) {
        const answers = await this.prisma.homeworkAnswerStudent.findMany({
            where: { homework_id: homeworkId },
            include: {
                students: {
                    select: {
                        id: true,
                        full_name: true,
                        photo: true,
                        phone: true
                    }
                },
                homeworkResults: {
                    select: {
                        id: true,
                        grade: true,
                        title: true,
                        status: true
                    }
                }
            }
        });
        return {
            success: true,
            data: answers
        };
    }

    async gradeHomework(payload: { homework_answer_id: number; grade: number; title: string; status: boolean }, currentUser: { id: number, role: Role }) {
        const existAnswer = await this.prisma.homeworkAnswerStudent.findUnique({
            where: { id: payload.homework_answer_id }
        });
        if (!existAnswer) {
            throw new NotFoundException("Homework answer not found");
        }
        const result = await this.prisma.homeworkResult.create({
            data: {
                homework_answer_id: payload.homework_answer_id,
                grade: Number(payload.grade),
                title: payload.title,
                status: payload.status,
                teacher_id: currentUser.role === 'TEACHER' ? currentUser.id : null,
                user_id: currentUser.role !== 'TEACHER' ? currentUser.id : null
            }
        });
        return {
            success: true,
            message: "Homework graded successfully",
            data: result
        };
    }

    async getGroupStatistics(groupId: number) {
        const groupHomeworks = await this.prisma.homework.findMany({
            where: { group_id: groupId }
        });
        const totalHomeworks = groupHomeworks.length;
        const homeworkIds = groupHomeworks.map(h => h.id);

        const groupStudents = await this.prisma.studentGroup.findMany({
            where: { group_id: groupId, status: 'active' },
            include: { students: true }
        });

        const stats = await Promise.all(groupStudents.map(async (sg) => {
            const studentId = sg.student_id;
            const student = sg.students;

            const answers = await this.prisma.homeworkAnswerStudent.findMany({
                where: { 
                    student_id: studentId,
                    homework_id: { in: homeworkIds }
                },
                include: { homeworkResults: true }
            });

            let qabulQilinganlar = 0;
            let qaytarilganlar = 0;
            let kutayotganlar = 0;
            let totalGrade = 0;
            let gradedCount = 0;

            answers.forEach(ans => {
                if (ans.homeworkResults && ans.homeworkResults.length > 0) {
                    const result = ans.homeworkResults[0];
                    if (result.grade >= 60 || result.status === true) {
                        qabulQilinganlar++;
                    } else {
                        qaytarilganlar++;
                    }
                    totalGrade += result.grade;
                    gradedCount++;
                } else {
                    kutayotganlar++;
                }
            });

            const bajarilmagan = totalHomeworks - answers.length;
            const ortachaBaho = gradedCount > 0 ? Math.round(totalGrade / gradedCount) : 0;

            return {
                student_id: studentId,
                full_name: student.full_name,
                ortacha_baho: ortachaBaho,
                qabul_qilinganlar: qabulQilinganlar,
                qaytarilganlar: qaytarilganlar,
                kutayotganlar: kutayotganlar,
                bajarilmagan: bajarilmagan,
                total_homeworks: totalHomeworks
            };
        }));

        return {
            success: true,
            data: stats
        };
    }
}
