import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: unknown) {
    return this.authService.signup(body);
  }

  @Post('signin')
  @HttpCode(200)
  signin(@Body() body: unknown) {
    return this.authService.signin(body);
  }
}
