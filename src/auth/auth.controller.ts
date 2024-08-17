import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Redirect,
    UseFilters,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HttpExceptionFilter } from 'src/helpers/filter/exception.filter';
import { TransformInterceptor } from 'src/helpers/interceptor/transform.interceptor';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign_up.dto';

@Controller('auth/v1')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(TransformInterceptor)
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }

  @Post('/login')
  login(@Body() signUpDto: SignUpDto) {
    return this.authService.login(signUpDto);
  }

  @Get('confirm')
  @Redirect('https://youtube.com')
  async confirmEmail(@Query('token') token: string) {
    return await this.authService.confirmEmail(token);
  }
}