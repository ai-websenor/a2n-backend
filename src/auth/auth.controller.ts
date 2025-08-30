import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import {
  RegisterResponse,
  OnboardingResponse,
  LoginResponse,
} from './dto/auth-response.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginDto, OnboardingDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<RegisterResponse> {
    return this.authService.register(dto);
  }

  @Post('onboarding')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  async completeOnboarding(
    @Request() req,
    @Body() dto: OnboardingDto,
  ): Promise<OnboardingResponse> {
    return this.authService.completeOnboarding(req.user.id, dto);
  }

  @Get('onboarding-status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  async getOnboardingStatus(@Request() req) {
    return this.authService.getOnboardingStatus(req.user.id);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return await this.authService.login(loginDto);
  }
}
