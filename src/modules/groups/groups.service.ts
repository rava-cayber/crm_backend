import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateGroupDto } from './dto/create.dto';
import { Status, GroupStatus } from '@prisma/client';
import { filterDto } from './dto/search';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    async getGroupOne(groupId: number) {
        const existGroup = await this.prisma.group.findFirst({
            where: {
                id: groupId,
                status: Status.active
            }
        })

        if (!existGroup) {
            throw new NotFoundException("Group not found with this id")
        }

        const groupStudents = await this.prisma.studentGroup.findMany({
            where: {
                group_id: groupId,
                status: Status.active
            },
            select: {
                students: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                        email: true,
                        photo: true,
                        birth_date: true,
                        created_at: true
                    }
                }
            }
        })

        const dataFormatter = groupStudents.map(el => el.students)

        return {
            success: true,
            data: dataFormatter
        }
    }

    async getGroupById(groupId: number) {
        const group = await this.prisma.group.findFirst({
            where: {
                id: groupId,
                status: Status.active
            },
            select: {
                id: true,
                name: true,
                start_date: true,
                start_time: true,
                week_day: true,
                courses: { select: { id: true, name: true, duration_hours: true } },
                rooms: { select: { id: true, name: true } },
                teachers: { select: { id: true, full_name: true, photo: true } },
                studentGroups: { select: { id: true } }
            }
        });

        if (!group) {
            throw new NotFoundException("Group not found");
        }

        return {
            success: true,
            data: group
        };
    }

    async getAllGroups(search: filterDto) {
        const { groupName, max_student, status } = search
        let searchWhere = {
            status: (status as any) || Status.active,
        }

        if (groupName) {
            searchWhere["name"] = groupName
        }
        if (max_student) {
            searchWhere["max_student"] = +max_student
        }

        const groups = await this.prisma.group.findMany({
            where: searchWhere,
            select: {
                id: true,
                name: true,
                max_student: true,
                start_date: true,
                start_time: true,
                week_day: true,
                courses: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                rooms: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                teachers: {
                    select: {
                        id: true,
                        full_name: true
                    }
                },
                studentGroups: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        })

        return {
            success: true,
            data: groups
        }
    }

    async createGroup(payload: CreateGroupDto) {

    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    const existRoom = await this.prisma.room.findFirst({
        where: {
            id: payload.room_id,
            status: Status.active
        }
    });

    if (!existRoom) {
        throw new NotFoundException("Room is not found with this id");
    }

    const existCourse = await this.prisma.course.findFirst({
        where: {
            id: payload.course_id,
            status: Status.active
        }
    });

    if (!existCourse) {
        throw new NotFoundException("Course is not found or inactive with this id");
    }

    const existTeacher = await this.prisma.teacher.findFirst({
        where: {
            id: payload.teacher_id,
            status: Status.active
        }
    });

    if (!existTeacher) {
        throw new NotFoundException("Teacher is not found with this id");
    }

    const existGroup = await this.prisma.group.findUnique({
        where: { name: payload.name }
    });

    if (existGroup) {
        throw new ConflictException("Group already exists");
    }

    const startNew = timeToMinutes(payload.start_time);
    const endNew = startNew + existCourse.duration_hours * 60;

    const roomGroups = await this.prisma.group.findMany({
        where: {
            room_id: payload.room_id,
            status: Status.active
        },
        select: {
            start_time: true,
            courses: {
                select: {
                    duration_hours: true
                }
            }
        }
    });

    const isRoomBusy = roomGroups.some(el => {
        const start = timeToMinutes(el.start_time);
        const end = start + el.courses.duration_hours * 60;

        return start < endNew && end > startNew;
    });

    if (isRoomBusy) {
        throw new ConflictException("Room is busy at this time");
    }

    const newGroup = await this.prisma.group.create({
        data: {
            ...payload,
            start_date: new Date(payload.start_date)
        }
    });

    return {
        success: true,
        message: "Group created successfully",
        data: newGroup
    };
}

    async updateGroup(id: number, payload: Partial<CreateGroupDto>) {
        const updateData: any = { ...payload };
        if (payload.start_date) {
            updateData.start_date = new Date(payload.start_date);
        }

        await this.prisma.group.update({
            where: { id },
            data: updateData
        });

        return { success: true, message: "Group updated" };
    }

    async deleteGroup(id: number) {
        await this.prisma.group.update({
            where: { id },
            data: { status: GroupStatus.inactive }
        });
        return { success: true, message: "Group deleted" };
    }

    async addStudentToGroup(payload: { student_id: number, group_id: number }) {
        const existGroup = await this.prisma.group.findUnique({
            where: { id: payload.group_id }
        });
        if (!existGroup) throw new NotFoundException("Group not found");

        const existStudent = await this.prisma.student.findUnique({
            where: { id: payload.student_id }
        });
        if (!existStudent) throw new NotFoundException("Student not found");

        const alreadyInGroup = await this.prisma.studentGroup.findUnique({
            where: {
                student_id_group_id: {
                    student_id: payload.student_id,
                    group_id: payload.group_id
                }
            }
        });

        if (alreadyInGroup) {
            if (alreadyInGroup.status === Status.active) {
                throw new ConflictException("Student already in this group");
            } else {
                await this.prisma.studentGroup.update({
                    where: { id: alreadyInGroup.id },
                    data: { status: Status.active }
                });
            }
        } else {
            await this.prisma.studentGroup.create({
                data: {
                    student_id: payload.student_id,
                    group_id: payload.group_id
                }
            });
        }

        return { success: true, message: "Student added to group" };
    }

    async addTeacherToGroup(payload: { teacher_id: number, group_id: number }) {
        const existGroup = await this.prisma.group.findUnique({
            where: { id: payload.group_id }
        });
        if (!existGroup) throw new NotFoundException("Group not found");

        const existTeacher = await this.prisma.teacher.findUnique({
            where: { id: payload.teacher_id }
        });
        if (!existTeacher) throw new NotFoundException("Teacher not found");

        const alreadyInGroup = await this.prisma.teacherGroup.findUnique({
            where: {
                teacher_id_group_id: {
                    teacher_id: payload.teacher_id,
                    group_id: payload.group_id
                }
            }
        });

        if (alreadyInGroup) {
            if (alreadyInGroup.status === Status.active) {
                throw new ConflictException("Teacher already in this group");
            } else {
                await this.prisma.teacherGroup.update({
                    where: { id: alreadyInGroup.id },
                    data: { status: Status.active }
                });
            }
        } else {
            await this.prisma.teacherGroup.create({
                data: {
                    teacher_id: payload.teacher_id,
                    group_id: payload.group_id
                }
            });
        }

        return { success: true, message: "Teacher added to group" };
    }
}
