import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateHomeworkDto } from './dto/create.dto';
import { Role } from '@prisma/client';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';

@ApiBearerAuth()
@ApiTags('Homework')
@Controller('homework')
export class HomeworkController {
    constructor(private readonly homeworkService: HomeworkService) { }

    @ApiOperation({
        summary: `Get all homework assignments for a specific lesson`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT)
    @Get("lesson/:lessonId")
    getLessonHomework(
        @Param("lessonId", ParseIntPipe) lessonId : number
    ){
        return this.homeworkService.getOwnHomework(lessonId);
    }

    @ApiOperation({
        summary: `${Role.STUDENT}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @Get("own/:lessonId")
    getOwnHomework(
        @Param("lessonId", ParseIntPipe) lessonId : number,
        @Req() req : Request){
        return this.homeworkService.getOwnHomework(lessonId,req['user'])
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get("all")
    getAllHomework(){
        return this.homeworkService.getAllHomework()
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                lesson_id: { type: "number" },
                group_id: { type: "number" },
                file: { type: 'string', format: 'binary' },
                title: { type: "string" },
            }
        }
    })
    @UseInterceptors(FileInterceptor("file", {
        storage: diskStorage({
            destination: "./src/uploads/files",
            filename: (req, file, cb) => {
                const filename = Date.now() + "." + file.mimetype.split("/")[1]
                cb(null, filename)
            }
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/^video\//)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Only video files are allowed!'), false);
            }
        }
    }))
    @Post()
    createHomework(
        @Req() req : Request,
        @Body() payload: CreateHomeworkDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return this.homeworkService.createHomework(payload,req["user"],file?.filename)
    }

    @ApiOperation({
        summary: `Student submits homework answer`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                homework_id: { type: "number" },
                file: { type: 'string', format: 'binary' },
                title: { type: "string" },
            }
        }
    })
    @UseInterceptors(FileInterceptor("file", {
        storage: diskStorage({
            destination: "./src/uploads/files",
            filename: (req, file, cb) => {
                const filename = Date.now() + "." + file.mimetype.split("/")[1]
                cb(null, filename)
            }
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/^video\//)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Only video files are allowed!'), false);
            }
        }
    }))
    @Post("submit")
    submitHomeworkAnswer(
        @Req() req: Request,
        @Body() payload: { homework_id: string; title: string },
        @UploadedFile() file?: Express.Multer.File
    ) {
        return this.homeworkService.submitHomeworkAnswer(
            Number(payload.homework_id),
            payload.title,
            req["user"].id,
            file?.filename
        )
    }

    @ApiOperation({
        summary: `Get all submitted answers for a homework assignment`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Get("answers/:homeworkId")
    getHomeworkAnswers(
        @Param("homeworkId", ParseIntPipe) homeworkId: number
    ) {
        return this.homeworkService.getHomeworkAnswers(homeworkId);
    }

    @ApiOperation({
        summary: `Teacher grades a student submission`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Post("grade")
    gradeHomework(
        @Req() req: Request,
        @Body() payload: { homework_answer_id: number; grade: number; title: string; status: boolean }
    ) {
        return this.homeworkService.gradeHomework(payload, req["user"]);
    }

    @ApiOperation({ summary: `Get homework statistics for a group` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Get("statistics/group/:groupId")
    getGroupStatistics(@Param("groupId", ParseIntPipe) groupId: number) {
        return this.homeworkService.getGroupStatistics(groupId);
    }
}
