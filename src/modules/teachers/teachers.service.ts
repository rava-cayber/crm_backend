import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateTeacherDto } from './dto/create.dto';
import * as bcrypt from "bcrypt"
import { Status } from '@prisma/client';
import { TeacherFilterDto } from './dto/filter.dto';

@Injectable()
export class TeachersService {
    constructor(private prisma : PrismaService){}

    async getAllTeachers(filter: TeacherFilterDto){
        const teachers = await this.prisma.teacher.findMany({
            where:{
                status: (filter.status as any) || Status.active
            },
            select:{
                id:true,
                full_name:true,
                phone:true,
                photo:true,
                email:true,
                address:true,
            },
            orderBy:{
                id:'desc'
            }
        })

        return {
            success:true,
            data:teachers
        }
    }

    async createTeacher(payload : CreateTeacherDto, filename? : string){

        const existTeacher = await this.prisma.teacher.findFirst({
            where:{
                OR:[
                    {phone:payload.phone},
                    {email:payload.email}
                ]
            }
        })

        if(existTeacher){

            throw new ConflictException()
        }

        const hashPass = await bcrypt.hash(payload.password,10)

        await this.prisma.teacher.create({
            data:{
                full_name:payload.full_name,
                photo:filename ?? null,
                phone:payload.phone,
                email:payload.email,
                password:hashPass,
                address:payload.address
            }
        })

        return {
            success:true,
            message:"Teacher created"
        }
    }

    async updateTeacher(id: number, payload: Partial<CreateTeacherDto>, filename?: string) {
        const updateData: any = { ...payload };
        if (payload.password) {
            updateData.password = await bcrypt.hash(payload.password, 10);
        }
        if (filename) {
            updateData.photo = filename;
        }

        await this.prisma.teacher.update({
            where: { id },
            data: updateData
        });

        return { success: true, message: "Teacher updated" };
    }

    async deleteTeacher(id: number) {
        await this.prisma.teacher.update({
            where: { id },
            data: { status: Status.inactive }
        });
        return { success: true, message: "Teacher deleted" };
    }
}
