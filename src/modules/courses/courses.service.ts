import { ConflictException, Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create.dto';
import { Status } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { CourseFilterDto } from './dto/filter.dto';

@Injectable()
export class CoursesService {
    constructor(private prisma : PrismaService){}
    
        async getAllCourses(filter: CourseFilterDto){
            const courses = await this.prisma.course.findMany({
                where:{
                    status: (filter.status as any) || Status.active
                },
                orderBy:{id:'desc'}
            })
    
            return {
                success : true,
                data:courses
            }
        }
    
        async createCourse(payload : CreateCourseDto){

            const existCourse = await this.prisma.course.findUnique({
                where:{name:payload.name}
            })
    
            if(existCourse) {
                throw new ConflictException("Course already exists")
            }
    
            await this.prisma.course.create({
                data:payload
            })
    
            return {
                success : true,
                message : "Course created"
            }
        }
    async updateCourse(id: number, payload: Partial<CreateCourseDto>) {
        await this.prisma.course.update({
            where: { id },
            data: payload
        });
        return { success: true, message: "Course updated" };
    }

    async deleteCourse(id: number) {
        await this.prisma.course.update({
            where: { id },
            data: { status: Status.inactive }
        });
        return { success: true, message: "Course deleted" };
    }
}
