import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateStudentDto } from './dto/create.dto';
import * as bcrypt from "bcrypt"
import { Status } from '@prisma/client';
import { EmailService } from 'src/common/email/email.service';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class StudentsService {
    constructor(
        private prisma : PrismaService,
        private emailService : EmailService
    ){}

    async getMyGroups(currentUser : { id : number}){
        const user = await this.prisma.user.findUnique({ where: { id: currentUser.id } });
        let resolvedStudentId = currentUser.id;
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

        const myGroups = await this.prisma.studentGroup.findMany({
            where:{
                student_id: resolvedStudentId
            },
            select:{
                groups:{
                    select:{
                        id:true,
                        name:true,
                        start_date:true,
                        courses:{
                            select:{
                                name:true
                            }
                        },
                        teachers:{
                            select:{
                                full_name:true,
                                photo:true
                            }
                        }
                    }
                }
            }
        })

        return {
            success : true,
            data: myGroups.map(el => el.groups)
        }
    }

    async getAllStudents(pagination : PaginationDto){
        //pagination
        const {page,limit,status} = pagination
        const students = await this.prisma.student.findMany({
            where:{
                status: (status as any) || Status.active
            },
            select:{
                id:true,
                full_name:true,
                phone:true,
                photo:true,
                email:true,
                address:true,
                birth_date:true
            },
            orderBy:{
                id:'desc'
            },
            skip:(limit? +limit : 10) * (page ? +page - 1 : 0),
            take:limit? +limit : 10
        })

        return {
            success:true,
            data:students
        }
    }

    async createStudent(payload : CreateStudentDto, filename? : string){

        const existStudent = await this.prisma.student.findFirst({
            where:{
                OR:[
                    {phone:payload.phone},
                    {email:payload.email}
                ]
            }
        })

        if(existStudent){
            throw new ConflictException()
        }

        const hashPass = await bcrypt.hash(payload.password,10)

        // 1. Create Student
        await this.prisma.student.create({
            data:{
                full_name:payload.full_name,
                photo:filename ?? null,
                phone:payload.phone,
                birth_date:new Date(payload.birth_date),
                email:payload.email,
                password:hashPass,
                address:payload.address
            }
        })

        // 2. Split name for User table
        const nameParts = payload.full_name.trim().split(/\s+/);
        const first_name = nameParts[0] || 'Student';
        const last_name = nameParts.slice(1).join(' ') || '';

        // 3. Create Login user
        await this.prisma.user.create({
            data: {
                first_name,
                last_name,
                password: hashPass,
                role: 'STUDENT',
                phone: payload.phone,
                email: payload.email,
                address: payload.address,
                photo: filename ?? null
            }
        });

        try {
            await this.emailService.sendEmail(payload.email, payload.phone, payload.password)
        } catch (error) {
            console.error("Email sending failed:", error.message);
        }

        return {
            success: true,
            message: "Student created"
        }
    }

    async updateStudent(id: number, payload: Partial<CreateStudentDto>, filename?: string) {
        const existingStudent = await this.prisma.student.findUnique({ where: { id } });
        if (!existingStudent) throw new NotFoundException("Student not found");

        const updateData: any = { ...payload };
        if (payload.password) {
            updateData.password = await bcrypt.hash(payload.password, 10);
        }
        if (payload.birth_date) {
            updateData.birth_date = new Date(payload.birth_date);
        }
        if (filename) {
            updateData.photo = filename;
        }

        await this.prisma.student.update({
            where: { id },
            data: updateData
        });

        // Sync with User table
        const nameParts = (payload.full_name || existingStudent.full_name).trim().split(/\s+/);
        const first_name = nameParts[0] || 'Student';
        const last_name = nameParts.slice(1).join(' ') || '';

        const userUpdateData: any = {};
        if (payload.full_name) {
            userUpdateData.first_name = first_name;
            userUpdateData.last_name = last_name;
        }
        if (payload.password) {
            userUpdateData.password = updateData.password;
        }
        if (payload.phone) {
            userUpdateData.phone = payload.phone;
        }
        if (payload.email) {
            userUpdateData.email = payload.email;
        }
        if (payload.address) {
            userUpdateData.address = payload.address;
        }
        if (filename) {
            userUpdateData.photo = filename;
        }

        await this.prisma.user.updateMany({
            where: {
                OR: [
                    { phone: existingStudent.phone },
                    { email: existingStudent.email }
                ]
            },
            data: userUpdateData
        });

        return { success: true, message: "Student updated" };
    }

    async deleteStudent(id: number) {
        const student = await this.prisma.student.findUnique({ where: { id } });
        
        await this.prisma.student.update({
            where: { id },
            data: { status: 'inactive' }
        });

        if (student) {
            await this.prisma.user.updateMany({
                where: {
                    OR: [
                        { phone: student.phone },
                        { email: student.email }
                    ]
                },
                data: { status: 'inactive' }
            });
        }

        return { success: true, message: "Student deleted" };
    }
}
