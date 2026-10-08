import { HttpStatus, Injectable } from '@nestjs/common';
import { CustomErrorException } from '../../exceptions/custom-error.exception';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { PasswordUtil } from 'src/utils/password.util';
import { Types } from 'mongoose';
import { UserRole } from 'src/enum/role.enum';
import { SmsUtil } from 'src/utils/sms.util';
import { User } from '../user/user.entity';
import { LoginOtpDto } from './dto/loginOtp.dto';
import { VerifyOtpDto } from './dto/verifyOtp.dto';

@Injectable()
export class AuthService {

  constructor(private readonly jwtService: JwtService, private readonly passwordUtil: PasswordUtil, private readonly userService: UserService, private readonly smsUtil: SmsUtil) { }
  
  async verifyToken(userId: Types.ObjectId, token: string) {
    const user = await this.userService.findUserById(userId, true);
    if (!user?.auth_token || user.auth_token !== token) {
      throw new CustomErrorException('Invalid token.', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  async loginOtp(loginDto: LoginOtpDto, isAdmin: boolean = false) {
    const user = await this.userService.validatePhone(loginDto.phone);
    if (!user) {
      throw new CustomErrorException('User not found.', HttpStatus.NOT_FOUND);
    }

    if (isAdmin && user.role !== UserRole.SUPERADMIN && user.role !== UserRole.ADMIN) {
      throw new CustomErrorException('Invalid user.', HttpStatus.UNAUTHORIZED);
    }

    user.otp = Math.floor(1000 + Math.random() * 9000);
    user.otp_expiry = new Date(new Date().getTime() + 5 * 60000); // 5 minutes
    await user.save();

    this.smsUtil.sendOTP(user.phone, user.otp);
    return {
      id: user.id,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.userService.findUserById(verifyOtpDto.userId);
    if (!user) {
      throw new CustomErrorException('User not found.', HttpStatus.NOT_FOUND);
    }

    if (user.otp_expiry < new Date()) {
      throw new CustomErrorException('OTP expired.', HttpStatus.UNAUTHORIZED);
    }

    if (user.otp !== verifyOtpDto.otp) {
      throw new CustomErrorException('Invalid OTP.', HttpStatus.UNAUTHORIZED);
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    user.auth_token = this.jwtService.sign(payload);
    user.otp = 0;
    user.otp_expiry = null;
    await user.save();
    
    const userDetails = this.userService.userDetails(user as unknown as any);
    return {
      ...userDetails,
      auth_token: user.auth_token,
    };
  }

  async login(loginDto: LoginDto, isAdmin: Boolean = false) {
    const user = await this.userService.validateEmail(loginDto.email);
    if (!user) {
      throw new CustomErrorException('User not found.', HttpStatus.NOT_FOUND);
    }

    if (isAdmin && user.role !== UserRole.SUPERADMIN && user.role !== UserRole.ADMIN) {
      throw new CustomErrorException('Access denied. User does not have admin privileges.', HttpStatus.FORBIDDEN);
    }

    const match = await this.passwordUtil.comparePassword(loginDto.password, user.password)

    if (!match) {
      throw new CustomErrorException('Invalid password.', HttpStatus.UNAUTHORIZED);
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    user.auth_token = this.jwtService.sign(payload);

    await user.save();
    const userDetails = this.userService.userDetails(user as unknown as any);
    return {
      ...userDetails,
      auth_token: user.auth_token,
    };

  }

  async logout(req: Request) {
    const user = await this.userService.findUserById(req['user']?.userId);
    if (!user) {
      throw new CustomErrorException('User not found.', HttpStatus.NOT_FOUND);
    }

    user.auth_token = null;
    await user.save();
    return { id: user.id };

  }
}
