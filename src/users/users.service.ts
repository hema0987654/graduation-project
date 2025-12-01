import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, userDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

@Injectable()
export class UsersService {
  private readonly redis: Redis;

  constructor(
    @InjectModel(User.name) private userModel: Model<userDocument>,
  ) {
    this.redis = new Redis();
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email }).select('+password');

    return user;
  }

  async increaseLoginAttempts(email: string) {
    try {
        const key = `login_attempts_${email}`;
        const attempts = await this.redis.incr(key);

        if (attempts === 1) {
            await this.redis.expire(key, 60 * 15);
        }
    } catch (error) {
        throw new HttpException(
            `Failed to increaseLoginAttempts user: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}
  async validatePassword(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const existed = await this.userModel.findOne({ email: createUserDto.email });
    if (existed)
      throw new HttpException('User already exists', HttpStatus.CONFLICT);

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    await newUser.save();

    return newUser;
  }

  findAll() {
    return this.userModel.find().select('-password');
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password');

    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return user;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return { message: 'User deleted successfully' };
  }
}
