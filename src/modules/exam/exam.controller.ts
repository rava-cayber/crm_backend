import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExamService } from "./exam.service";
import { CreateExamDto, UpdateExamDto } from "./dto/create-exam.dto";
import { AuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/role.guard";
import { Roles } from "src/common/decorators/role";
import { Role } from "@prisma/client";

@ApiBearerAuth()
@ApiTags("Exam")
@Controller("exam")
export class ExamController {
    constructor(private examService: ExamService) {}

    @ApiOperation({ summary: "Create a new exam" })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Post()
    create(@Body() dto: CreateExamDto, @Req() req: Request) {
        return this.examService.create(dto, req["user"]);
    }

    @ApiOperation({ summary: "Get all exams for a group" })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT)
    @Get("group/:groupId")
    findByGroup(@Param("groupId", ParseIntPipe) groupId: number) {
        return this.examService.findByGroup(groupId);
    }

    @ApiOperation({ summary: "Get a single exam" })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Get(":id")
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.examService.findOne(id);
    }

    @ApiOperation({ summary: "Delete an exam" })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Delete(":id")
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.examService.remove(id);
    }

    @ApiOperation({ summary: "Update an exam" })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Patch(":id")
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateExamDto) {
        return this.examService.update(id, dto);
    }

    @ApiOperation({ summary: "Update exam status" })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Patch(":id/status")
    updateStatus(@Param("id", ParseIntPipe) id: number, @Body("status") status: string) {
        return this.examService.updateStatus(id, status);
    }
}
