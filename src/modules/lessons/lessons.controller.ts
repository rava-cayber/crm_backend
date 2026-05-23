import { Body, Controller, Get, Param, ParseIntPipe, Post, Delete, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create.lesson.dto';
import { Roles } from 'src/common/decorators/role';
import { Role } from '@prisma/client';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
    constructor(private readonly lessonService: LessonsService){}

    @ApiOperation({
        summary:`${Role.STUDENT}`
    })
    @UseGuards(AuthGuard,RolesGuard)
    @Roles(Role.STUDENT)
    @Get("my/group/:groupId")
    getMyGroupLessons(
        @Param("groupId", ParseIntPipe) groupId : number,
        @Req() req : Request
    ){
        return this.lessonService.getMyGroupLessons(groupId,req['user'])
    }


    @ApiOperation({
        summary:`${Role.ADMIN}`
    })
    @UseGuards(AuthGuard,RolesGuard)
    @Roles(Role.ADMIN,Role.SUPERADMIN)
    @Get()
    getAllLessons(){
        return this.lessonService.getAllLessons()
    }

    @ApiOperation({
        summary:`${Role.ADMIN}, ${Role.TEACHER}, ${Role.SUPERADMIN}`
    })
    @UseGuards(AuthGuard,RolesGuard)
    @Roles(Role.ADMIN,Role.TEACHER,Role.SUPERADMIN)
    @Get("group/:groupId")
    getLessonsByGroupId(
        @Param("groupId", ParseIntPipe) groupId: number
    ){
        return this.lessonService.getLessonsByGroupId(groupId)
    }

    @ApiOperation({
        summary:`${Role.ADMIN}, ${Role.TEACHER}`
    })
    @UseGuards(AuthGuard,RolesGuard)
    @Roles(Role.ADMIN,Role.TEACHER,Role.SUPERADMIN)
    @Post()
    createLesson(
        @Body() payload : CreateLessonDto,
        @Req() req : Request
    ){
        return this.lessonService.createLesson(payload,req['user'])
    }

    @ApiOperation({
        summary:`Upload video to a lesson. Only video files are allowed. (${Role.ADMIN}, ${Role.TEACHER})`
    })
    @UseGuards(AuthGuard,RolesGuard)
    @Roles(Role.ADMIN,Role.TEACHER,Role.SUPERADMIN)
    @Post("video/:lessonId")
    @UseInterceptors(FileInterceptor("file", {
        storage: diskStorage({
            destination: "./src/uploads/files",
            filename: (req, file, cb) => {
                const filename = Date.now() + "." + file.mimetype.split("/")[1];
                cb(null, filename);
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
    uploadVideo(
        @Param("lessonId", ParseIntPipe) lessonId: number,
        @UploadedFile() file: Express.Multer.File
    ){
        if(!file) throw new BadRequestException("Video file is required");
        return this.lessonService.uploadVideo(lessonId, file.filename);
    }

    @ApiOperation({
        summary:`Delete video from a lesson. (${Role.ADMIN}, ${Role.TEACHER})`
    })
    @UseGuards(AuthGuard,RolesGuard)
    @Roles(Role.ADMIN,Role.TEACHER,Role.SUPERADMIN)
    @Delete("video/:lessonId")
    deleteVideo(
        @Param("lessonId", ParseIntPipe) lessonId: number
    ){
        return this.lessonService.deleteVideo(lessonId);
    }
}
