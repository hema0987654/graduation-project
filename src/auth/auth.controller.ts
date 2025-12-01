import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OtpService } from 'src/otp/otp.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { EmailService } from 'src/email/email.service';
import { ForgotPasswordDto } from './dto/forget-password.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly otpService: OtpService,
        private readonly emailService: EmailService
    ) {}

    @Post('register')
    async register(@Body() info: CreateUserDto) {
        return this.otpService.sendEmail(info);
    }

    @Post('verify')
    async verify(@Body() body: { email: string; otp: string }) {
        return this.otpService.verifyOtp(body.email, body.otp);
    }

    @Post('login')
    login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body: { email: string }) {
        const { resetLink } = await this.authService.forgotPassword(body.email);
        return this.emailService.sendGenericEmail(body.email, resetLink, 'Reset Password');
    }

    @Post('reset-password')
    async resetPassword(@Body() body: ForgotPasswordDto) {
        return this.authService.resetPassword(body);
    }
}
