import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from '../module/auth/auth.service';
import { stringToObjectId } from '../utils/mongo.util';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly authService: AuthService) { }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: process.env.JWT_SECRET,
        }
      );

      payload['userId'] = stringToObjectId(payload['userId']);
      await this.authService.verifyToken(payload['userId'], token);
      
      payload["auth_token"] = token;
      request['user'] = payload;
      return true;

    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new UnauthorizedException();
    }

  }

}
