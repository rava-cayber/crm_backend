import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class TeacherFilterDto {
    @ApiPropertyOptional()
    @IsOptional()
    status?: string
}
