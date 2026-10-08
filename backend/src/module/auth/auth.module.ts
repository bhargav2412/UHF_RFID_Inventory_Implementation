import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';

import { PasswordUtil } from 'src/utils/password.util';
import { SmsUtil } from 'src/utils/sms.util';

@Module({
  imports: [
    forwardRef(() => UserModule)
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordUtil, SmsUtil],
  exports: [AuthService]
})
export class AuthModule {}
