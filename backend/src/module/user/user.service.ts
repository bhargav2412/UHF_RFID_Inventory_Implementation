import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PasswordUtil } from 'src/utils/password.util';
import { CustomErrorException } from 'src/exceptions/custom-error.exception';
import { defaultMetaData, MetadataDto } from 'src/dto/metadata.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly passwordUtil: PasswordUtil
  ) {}

  async validateEmail(email: string, throwError: boolean = false) {
    const user = await this.userModel.findOne({ email, deleted_at: null });
    if (user && throwError) {
      throw new CustomErrorException('Email already exists.', HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  async validatePhone(phone: string, throwError: boolean = false) {
    const user = await this.userModel.findOne({ phone, deleted_at: null });
    if (user && throwError) {
      throw new CustomErrorException('Phone already exists.', HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  userDetails(user: UserDocument) {
    return {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }

  async findUserById(id: Types.ObjectId, throwError: boolean = false) {
    const user = await this.userModel.findById(id).where({ deleted_at: null }).select({ password: 0 });
    if (!user && throwError) {
      throw new CustomErrorException('User not found.', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.email) {
      await this.validateEmail(createUserDto.email, true);
    }
    if (createUserDto.phone) {
      await this.validatePhone(createUserDto.phone, true);
    }

    const createdUser = new this.userModel(createUserDto);
    createdUser.password = await this.passwordUtil.hashPassword(createdUser.password);

    await createdUser.save();
    return this.userDetails(createdUser);
  }
  async findAll(queryParams: MetadataDto = defaultMetaData) {
    const match: any = { deleted_at: null };
    if (queryParams.search_text) {
      match['$or'] = [
        { first_name: { $regex: queryParams.search_text, $options: 'i' } },
        { last_name: { $regex: queryParams.search_text, $options: 'i' } },
        { email: { $regex: queryParams.search_text, $options: 'i' } }
      ]
    }
    const project = { auth_token: 0, password: 0 };
    const sort: Record<string, 1 | -1> = queryParams.sort_by ? { [queryParams.sort_by]: queryParams.sort_order === 'asc' ? 1 : -1 } : { created_at: -1 };

    const limit = Math.min(queryParams.rows_per_page || 10, 100);
    const skip = (queryParams.page - 1) * limit;
    const result = await this.userModel.aggregate([
      { $match: match },
      { $project: project },
      {
        $facet: {
          data: [
            { $sort: sort },
            ...(limit > 0 ? [{ $skip: skip }, { $limit: limit }] : [])
          ],
          metadata: [
            { $count: 'total' }
          ]
        }
      },
    ]);
    return { data: result[0]?.data, total: result?.[0]?.metadata?.[0]?.total ?? 0 };
  }

  async findOne(id: Types.ObjectId) {
    const user = await this.findUserById(id, true);
    return this.userDetails(user);
  }

  async update(id: Types.ObjectId, updateUserDto: UpdateUserDto) {
    const user = await this.findUserById(id, true);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.validateEmail(updateUserDto.email, true);
    }
    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      await this.validatePhone(updateUserDto.phone, true);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await this.passwordUtil.hashPassword(updateUserDto.password);
    }
    
    user.set(updateUserDto);
    await user.save();
    return this.userDetails(user);
  }

  async remove(id: Types.ObjectId) {
    const user = await this.findUserById(id, true);
    user.deleted_at = new Date();
    await user.save();
    return { id: user._id };
  }
}
