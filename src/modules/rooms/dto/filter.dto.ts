import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class RoomFilterDto {
    @ApiPropertyOptional()
    @IsOptional()
    status?: string
}
