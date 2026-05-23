import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateExamDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    group_id: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    topic: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    lesson_id?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    deadline_date?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    deadline_time?: string;
}

export class UpdateExamDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    group_id?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    topic?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    lesson_id?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    deadline_date?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    deadline_time?: string;
}
