import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateRoomDto } from './dto/create.dto';
import { Status } from '@prisma/client';
import { RoomFilterDto } from './dto/filter.dto';

@Injectable()
export class RoomsService {
    constructor(private prisma: PrismaService) { }

    async getAllRooms(filter: RoomFilterDto) {
        const rooms = await this.prisma.room.findMany({
            where: { 
                status: (filter.status as any) || Status.active 
            },
            orderBy: { id: 'desc' }
        })
        return { success: true, data: rooms }
    }

    async createRoom(payload: CreateRoomDto) {
        const existRoom = await this.prisma.room.findUnique({
            where: { name: payload.name }
        })
        if (existRoom) {
            throw new ConflictException("Room already exists")
        }
        await this.prisma.room.create({ data: payload })
        return { success: true, message: "Room created" }
    }

    async updateRoom(id: number, payload: Partial<CreateRoomDto>) {
        await this.prisma.room.update({
            where: { id },
            data: payload
        });
        return { success: true, message: "Room updated" };
    }

    async deleteRoom(id: number) {
        await this.prisma.room.update({
            where: { id },
            data: { status: Status.inactive }
        });
        return { success: true, message: "Room deleted" };
    }
}
