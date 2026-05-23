import { ApiProperty } from "@nestjs/swagger"
import { IsMobilePhone, IsString } from "class-validator"

export class LoginDto {
    @ApiProperty({example:"975661099"})
    @IsMobilePhone("uz-UZ")
    phone:string

    @ApiProperty({example:"Benazir99!"})
    @IsString()
    password:string
}