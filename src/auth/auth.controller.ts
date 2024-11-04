import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('users')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() userDto: { name: string; password: string }) {
    return this.authService.register(userDto);
  }

  @Post('login')
  async login(@Body() userDto: { name: string; password: string }) {
    const user = await this.authService.validateUser(
      userDto.name,
      userDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }
}
