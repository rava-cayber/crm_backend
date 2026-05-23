import { ApiProperty } from "@nestjs/swagger"
import { IsDateString, IsEmail, IsMobilePhone, IsNotEmpty, IsString } from "class-validator"


export class CreateStudentDto {
    @ApiProperty({
        description: 'full_name'
    })
    @IsString()
    @IsNotEmpty()
    full_name: string

    @ApiProperty()
    @IsString()
    password: string

    @ApiProperty()
    @IsMobilePhone()
    phone: string

    @ApiProperty()
    @IsEmail()
    email: string

    @ApiProperty()
    @IsDateString()
    birth_date: string

    @ApiProperty()
    @IsString()
    address: string
}