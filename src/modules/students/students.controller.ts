import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UnsupportedMediaTypeException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Role, StudentStatus } from '@prisma/client';
import { StudentsService } from './students.service';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateStudentDto } from './dto/create.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PaginationDto } from './dto/pagination.dto';

@ApiBearerAuth()
@ApiTags('Students')
@Controller('students')
export class StudentsController {
    constructor(private readonly studentService: StudentsService) { }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @UseGuards(AuthGuard, RolesGuard)
    @Get()
    getAllStudents(@Query() pagination: PaginationDto) {
        return this.studentService.getAllStudents(pagination)
    }

    @ApiOperation({ summary: `${Role.STUDENT}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @Get("my/groups")
    getMyGroups(@Req() req: Request) {
        return this.studentService.getMyGroups(req['user'])
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                full_name: { type: 'string', example: "Alish" },
                email: { type: 'string' },
                password: { type: 'string' },
                phone: { type: 'string' },
                photo: { type: 'string', format: 'binary' },
                address: { type: "string" },
                birth_date: { type: 'string', format: 'date', example: '2000-01-01' },
            }
        }
    })
    @UseInterceptors(FileInterceptor("photo", {
        storage: diskStorage({
            destination: "./src/uploads",
            filename: (req, file, cb) => {
                const filename = Date.now() + "." + file.mimetype.split("/")[1]
                cb(null, filename)
            }
        }),
        fileFilter: (req, file, cb) => {
            const existFile = ["png", "jpg", "jpeg"]
            if (!existFile.includes(file.mimetype.split("/")[1])) {
                cb(new UnsupportedMediaTypeException(), false)
            }
            cb(null, true)
        }
    }))
    @Post()
    createStudent(
        @Body() payload: CreateStudentDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return this.studentService.createStudent(payload, file?.filename)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @UseInterceptors(FileInterceptor("photo", {
        storage: diskStorage({
            destination: "./src/uploads",
            filename: (req, file, cb) => {
                const filename = Date.now() + "." + file.mimetype.split("/")[1]
                cb(null, filename)
            }
        })
    }))
    @Patch(":id")
    updateStudent(
        @Param("id", ParseIntPipe) id: number,
        @Body() payload: Partial<CreateStudentDto>,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return this.studentService.updateStudent(id, payload, file?.filename)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Delete(":id")
    deleteStudent(@Param("id", ParseIntPipe) id: number) {
        return this.studentService.deleteStudent(id)
    }
}
