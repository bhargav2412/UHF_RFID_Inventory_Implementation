import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.entity';
import { MongooseModule } from '@nestjs/mongoose';

import { PasswordUtil } from 'src/utils/password.util';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), forwardRef(() => AuthModule)],
  controllers: [UserController],
  providers: [UserService, PasswordUtil],
  exports: [UserService, PasswordUtil],
})
export class UserModule {}
