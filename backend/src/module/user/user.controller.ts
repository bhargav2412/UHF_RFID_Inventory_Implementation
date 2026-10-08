import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ZodValidationPipe } from 'src/pipe/zod.pipe';
import { CreateUserSchema } from './schema/create-user.schema';
import { ResponseDto } from 'src/dto/response.dto';
import { stringToObjectId } from 'src/utils/mongo.util';
import { UpdateUserSchema } from './schema/update-user.schema';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'src/enum/role.enum';
import { MetadataDto } from 'src/dto/metadata.dto';
import { PaginationSchema } from 'src/schema/pagination.schema';

@Controller('user')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('current')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WORKER, UserRole.CUSTOMER)
  async currentUserInfo(@Req() req: Request) {
    const { userId } = req['user'];
    const user = await this.userService.findOne(userId);
    return new ResponseDto(user, 'User details.');
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async create(@Body(new ZodValidationPipe(CreateUserSchema)) createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return new ResponseDto(user, 'User created successfully.');
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async findAll(@Query(new ZodValidationPipe(PaginationSchema)) query: MetadataDto) {
    const { data: users, total } = await this.userService.findAll(query);
    return new ResponseDto(users, 'User list.', total);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    const userId = stringToObjectId(id);
    const user = await this.userService.findOne(userId);
    return new ResponseDto(user, 'User details.');
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateUserSchema)) updateUserDto: UpdateUserDto) {
    const userId = stringToObjectId(id);
    const user = await this.userService.update(userId, updateUserDto);
    return new ResponseDto(user, 'User updated successfully.');
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  async remove(@Param('id') id: string) {
    const userId = stringToObjectId(id);
    const result = await this.userService.remove(userId);
    return new ResponseDto(result, 'User deleted successfully.');
  }
}
