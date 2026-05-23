import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create.dto';
import { Roles } from 'src/common/decorators/role';
import { Role } from '@prisma/client';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoomFilterDto } from './dto/filter.dto';

@ApiBearerAuth()
@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomService: RoomsService) { }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Get()
    getAllRooms(@Query() filter: RoomFilterDto) {
        return this.roomService.getAllRooms(filter)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Post()
    createRoom(@Body() payload: CreateRoomDto) {
        return this.roomService.createRoom(payload)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Patch(":id")
    updateRoom(
        @Param("id", ParseIntPipe) id: number,
        @Body() payload: Partial<CreateRoomDto>
    ) {
        return this.roomService.updateRoom(id, payload)
    }

    @ApiOperation({ summary: `${Role.SUPERADMIN}, ${Role.ADMIN}` })
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Delete(":id")
    deleteRoom(@Param("id", ParseIntPipe) id: number) {
        return this.roomService.deleteRoom(id)
    }
}
