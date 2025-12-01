import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class ForgotPasswordDto {
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
        message: 'Password must contain upper, lower, number, and special character',
    })
    @Length(8, 100, { message: 'Password must be at least 8 characters long' })
    newPassword: string;

    @IsNotEmpty({ message: 'Token is required' })
    @IsString()
    token: string;
}
