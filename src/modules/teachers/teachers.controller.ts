import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateTeacherDto } from './dto/create.dto';
import { TeacherFilterDto } from './dto/filter.dto';

@ApiBearerAuth()
@ApiTags('Teachers')
@Controller('teachers')
export class TeachersController {
     constructor(private readonly teacherService: TeachersService) { }
    
        @ApiOperation({
            summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
        })
        @UseGuards(AuthGuard, RolesGuard)
        @Roles(Role.SUPERADMIN, Role.ADMIN)
        @Get()
        getAllTeachers(@Query() filter: TeacherFilterDto) {
            return this.teacherService.getAllTeachers(filter)
        }
    
        @ApiOperation({
            summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`,
            description: "Bu endpointga admin va superadmin huquqi bor"
        })
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
            })
        }))
        @Post()
        createTeacher(
            @Body() payload: CreateTeacherDto,
            @UploadedFile() file?: Express.Multer.File
        ) {
            return this.teacherService.createTeacher(payload, file?.filename)
        }

        @Patch(":id")
        @UseInterceptors(FileInterceptor("photo", {
            storage: diskStorage({
                destination: "./src/uploads",
                filename: (req, file, cb) => {
                    const filename = Date.now() + "." + file.mimetype.split("/")[1]
                    cb(null, filename)
                }
            })
        }))
        updateTeacher(
            @Param("id", ParseIntPipe) id: number,
            @Body() payload: Partial<CreateTeacherDto>,
            @UploadedFile() file?: Express.Multer.File
        ) {
            return this.teacherService.updateTeacher(id, payload, file?.filename)
        }

        @Delete(":id")
        deleteTeacher(@Param("id", ParseIntPipe) id: number) {
            return this.teacherService.deleteTeacher(id)
        }
}
