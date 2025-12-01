import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { User, userDocument } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ForgotPasswordDto } from './dto/forget-password.dto';

export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @InjectModel(User.name) private userModel: Model<userDocument>
    ) {}

    async register(info: CreateUserDto) {
        const user = await this.userService.findByEmail(info.email);
        if (user) throw new HttpException('User already exists', HttpStatus.CONFLICT);

        const newUser = await this.userService.create(info);

        const payload: JwtPayload = {
            sub: newUser._id.toString(),
            email: newUser.email,
            role: newUser.role,
        };

        const token = await this.jwtService.signAsync(payload);

        return { token, user: newUser };
    }

    async login(email: string, password: string) {
        const user = await this.userService.validatePassword(email, password);

        const payload: JwtPayload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        };

        const token = await this.jwtService.signAsync(payload);

        return { token, user };
    }

    async forgotPassword(email: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new HttpException('User not found', 404);

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(resetToken, 10);

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        const frontendUrl = this.configService.get('FRONTEND_URL');
        const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

        return { resetLink };
    }

    async resetPassword(info: ForgotPasswordDto) {
        const users = await this.userModel
            .find({
                resetPasswordExpires: { $gt: Date.now() }
            })
            .select('+resetPasswordToken');

        if (!users || users.length === 0) {
            throw new HttpException('Invalid or expired token', HttpStatus.BAD_REQUEST);
        }

        let userFound: any = null;

        for (const user of users) {
            if (!user.resetPasswordToken) continue;

            const match = await bcrypt.compare(info.token, user.resetPasswordToken);
            if (match) {
                userFound = user;
                break;
            }
        }

        if (!userFound) {
            throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
        }

        userFound.password = await bcrypt.hash(info.newPassword, 10);
        userFound.resetPasswordToken = undefined;
        userFound.resetPasswordExpires = undefined;

        await userFound.save();

        return { message: 'Password reset successfully' };
    }
}
