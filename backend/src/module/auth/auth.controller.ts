import { Controller, Post, Body, HttpCode, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { loginSchema } from './schema/login.schema';
import { AuthGuard } from 'src/guard/auth.guard';
import { VerifyOtpDto } from './dto/verifyOtp.dto';
import { verifyOtpSchema } from './schema/verifyOtp.schema';
import { LoginOtpDto } from './dto/loginOtp.dto';
import { loginOtpSchema } from './schema/loginOtp.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body(new ZodValidationPipe(loginSchema)) LoginDto: LoginDto) {
    const result = await this.authService.login(LoginDto);
    return new ResponseDto(result, 'Login successful.')
  }

  @Post('login/otp')
  @HttpCode(200)
  async loginOtp(@Body(new ZodValidationPipe(loginOtpSchema)) LoginOtpDto: LoginOtpDto) {
    const result = await this.authService.loginOtp(LoginOtpDto);
    return new ResponseDto(result, 'OTP sent successfully.')
  }

  @Post('admin/login')
  @HttpCode(200)
  async adminLogin(@Body(new ZodValidationPipe(loginSchema)) LoginDto: LoginDto) {
    const result = await this.authService.login(LoginDto, true);
    return new ResponseDto(result, 'Login successful.')
  }

  @Post('admin/login/otp')
  @HttpCode(200)
  async adminLoginOtp(@Body(new ZodValidationPipe(loginOtpSchema)) LoginOtpDto: LoginOtpDto) {
    const result = await this.authService.loginOtp(LoginOtpDto, true);
    return new ResponseDto(result, 'OTP sent successfully.')
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Body(new ZodValidationPipe(verifyOtpSchema)) verifyOtpDto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(verifyOtpDto);
    return new ResponseDto(result, 'Login successfully.')
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request) {
    const result = await this.authService.logout(req);
    return new ResponseDto(result, 'Logout successful.')
  }
}
