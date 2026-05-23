import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create.dto';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/role';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { filterDto } from './dto/search';
import { AddStudentToGroupDto } from './dto/add-student.dto';
import { AddTeacherToGroupDto } from './dto/add-teacher.dto';

@ApiBearerAuth()
@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
    constructor(private readonly groupService: GroupsService) { }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get("one/students/:groupId")
    getGroupOne(
        @Param("groupId", ParseIntPipe) groupId : number
    ){
        return this.groupService.getGroupOne(groupId)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get("all")
    getAllGroups(
        @Query() search : filterDto
    ) {
        return this.groupService.getAllGroups(search)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}, ${Role.TEACHER}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER)
    @Get(":id")
    getGroupById(
        @Param("id", ParseIntPipe) id: number
    ) {
        return this.groupService.getGroupById(id)
    }

    @ApiOperation({
        summary: `${Role.SUPERADMIN}, ${Role.ADMIN}`
    })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Post()
    createGroup(@Body() payload: CreateGroupDto) {
        return this.groupService.createGroup(payload)
    }

    @Patch(":id")
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    updateGroup(
        @Param("id", ParseIntPipe) id: number,
        @Body() payload: Partial<CreateGroupDto>
    ) {
        return this.groupService.updateGroup(id, payload)
    }

    @Delete(":id")
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    deleteGroup(@Param("id", ParseIntPipe) id: number) {
        return this.groupService.deleteGroup(id)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @UseGuards(AuthGuard, RolesGuard)
    @Post("add-student")
    addStudentToGroup(@Body() payload: AddStudentToGroupDto) {
        return this.groupService.addStudentToGroup(payload)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @UseGuards(AuthGuard, RolesGuard)
    @Post("add-teacher")
    addTeacherToGroup(@Body() payload: AddTeacherToGroupDto) {
        return this.groupService.addTeacherToGroup(payload)
    }
}
