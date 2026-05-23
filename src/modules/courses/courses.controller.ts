import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { CreateCourseDto } from './dto/create.dto';
import { CourseFilterDto } from './dto/filter.dto';

@ApiBearerAuth()
@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
    constructor(private readonly courseService: CoursesService) { }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get()
    getAllCourses(@Query() filter: CourseFilterDto) {
        return this.courseService.getAllCourses(filter)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Post()
    createCourse(@Body() payload: CreateCourseDto) {
        return this.courseService.createCourse(payload)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Patch(":id")
    updateCourse(
        @Param("id", ParseIntPipe) id: number,
        @Body() payload: Partial<CreateCourseDto>
    ) {
        return this.courseService.updateCourse(id, payload)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Delete(":id")
    deleteCourse(@Param("id", ParseIntPipe) id: number) {
        return this.courseService.deleteCourse(id)
    }
}
