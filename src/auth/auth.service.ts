// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { OnboardingDto, RegisterDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterDto) {
    const passwordHash = await bcrypt.hash(payload.password, this.SALT_ROUNDS);

    // Generate wildcard domain from account name
    const wildcardDomain = `*.${payload.accountName.toLowerCase()}.yourdomain.com`;

    // Generate username from email (part before @)
    const username = payload.email.split('@')[0].toLowerCase();

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: payload.email.toLowerCase(),
            username: username,
            password: passwordHash,
            fullName: payload.fullName,
            emailVerified: false,
            isActive: true,
          },
        });

        // Create initial onboarding record
        const onboarding = await tx.accountOnboarding.create({
          data: {
            userId: user.id,
            accountName: payload.accountName.toLowerCase(),
            wildcardDomain: wildcardDomain,
            currentStep: 'onboarding',
            completedSteps: ['registration'],
          },
        });

        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          accountName: onboarding.accountName,
          currentStep: onboarding.currentStep,
          nextStepUrl: '/auth/onboarding',
        };
      });

      return result;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const targets = Array.isArray(err.meta?.target)
          ? err.meta.target
          : [err.meta?.target].filter(Boolean);

        if (
          targets?.includes('users_email_key') ||
          targets?.includes('email')
        ) {
          throw new ConflictException('Email already registered');
        }
        if (
          targets?.includes('users_username_key') ||
          targets?.includes('username')
        ) {
          throw new ConflictException('Username already taken');
        }
        if (
          targets?.includes('account_onboarding_account_name_key') ||
          targets?.includes('account_name')
        ) {
          throw new ConflictException('Account name already taken');
        }

        throw new ConflictException('Registration failed: duplicate entry');
      }

      console.error('Registration Error:', err);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async completeOnboarding(userId: string, payload: OnboardingDto) {
    try {
      const existingOnboarding = await this.prisma.accountOnboarding.findUnique(
        {
          where: { userId },
          include: { user: true },
        },
      );

      if (!existingOnboarding) {
        throw new NotFoundException(
          'User not found or registration not started',
        );
      }

      if (existingOnboarding.currentStep !== 'onboarding') {
        throw new BadRequestException('Invalid onboarding step');
      }

      const updatedOnboarding = await this.prisma.accountOnboarding.update({
        where: { userId },
        data: {
          companySize: payload.companySize,
          roleInCompany: payload.department,
          companyDescription: payload.briefCompany,
          comfortLevel: payload.expertiseIn,
          referralSource: payload.hearAbout,
          currentStep: 'completed',
          completedSteps: ['registration', 'onboarding'],
          updatedAt: new Date(),
        },
        include: { user: true },
      });

      return {
        id: updatedOnboarding.user.id,
        email: updatedOnboarding.user.email,
        fullName: updatedOnboarding.user.fullName,
        accountName: updatedOnboarding.accountName,
        currentStep: updatedOnboarding.currentStep,
        completedSteps: updatedOnboarding.completedSteps,
        registrationComplete: true,
      };
    } catch (err: any) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }

      console.error('Onboarding Error:', err);
      throw new InternalServerErrorException('Failed to complete onboarding');
    }
  }

  async getOnboardingStatus(userId: string) {
    const onboarding = await this.prisma.accountOnboarding.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!onboarding) {
      throw new NotFoundException('User onboarding not found');
    }

    return {
      userId: onboarding.userId,
      currentStep: onboarding.currentStep,
      completedSteps: onboarding.completedSteps,
      accountName: onboarding.accountName,
      wildcardDomain: onboarding.wildcardDomain,
      isComplete: onboarding.currentStep === 'completed',
    };
  }

  async login(payload: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
      include: {
        onboarding : true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      accountName: user?.onboarding?.accountName,
      domain: user?.onboarding?.wildcardDomain,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = await this.jwtService.signAsync(jwtPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        accountName: user?.onboarding?.accountName,
        domain: user?.onboarding?.wildcardDomain || null,
      },
      expiresIn: 900,
    };
  }
}
