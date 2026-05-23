import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class CourseFilterDto {
    @ApiPropertyOptional()
    @IsOptional()
    status?: string
}
