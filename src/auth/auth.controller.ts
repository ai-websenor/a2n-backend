// src/auth/auth.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post, Param, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

import { RegisterResponse, OnboardingResponse } from './dto/auth-response.dto';
import { ApiTags } from '@nestjs/swagger';
import { OnboardingDto, RegisterDto } from './dto/auth.dto';

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<RegisterResponse> {
    return this.authService.register(dto);
  }

  @Post('onboarding/:userId')
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(
    @Param('userId') userId: string,
    @Body() dto: OnboardingDto
  ): Promise<OnboardingResponse> {
    return this.authService.completeOnboarding(userId, dto);
  }

  @Get('onboarding-status/:userId')
  @HttpCode(HttpStatus.OK)
  async getOnboardingStatus(@Param('userId') userId: string) {
    return this.authService.getOnboardingStatus(userId);
  }
}
