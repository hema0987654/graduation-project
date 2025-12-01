import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email address' })
    @Transform(({ value }) => value?.trim().toLowerCase())
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
        message: 'Password must contain upper, lower, number, and special character',
    })
    @Length(8, 100, { message: 'Password must be at least 8 characters long' })
    password: string;

    @IsNotEmpty({ message: 'Role is required' })
    @IsEnum(UserRole)
    @Transform(({ value }) => value?.trim().toLowerCase())
    role: UserRole;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    avatar_url: string;
}
