import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService : AuthService){}

    @ApiTags('Login')
    @Post("login")
    userLogin(@Body() payload : LoginDto){
        return this.authService.userLogin(payload)
    }
}
