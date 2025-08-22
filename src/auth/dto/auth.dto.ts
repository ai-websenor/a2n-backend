import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from "@nestjs/class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    format: 'email',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Password with minimum 8 characters, must contain uppercase, lowercase, number and special character',
    example: 'MyPassword123!',
    minLength: 8,
    maxLength: 100,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character'
  })
  password: string;

  @ApiProperty({
    description: 'Unique account name with only lowercase letters, numbers, and hyphens',
    example: 'my-company-2024',
    minLength: 3,
    maxLength: 100,
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Account name must contain only lowercase letters, numbers, and hyphens'
  })
  accountName: string;
}

export class OnboardingDto {
  @ApiProperty({
    description: 'Size of the company',
    example: '50-100 employees',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  companySize: string;

  @ApiProperty({
    description: 'Department or team the user belongs to',
    example: 'Engineering',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  department: string;

  @ApiProperty({
    description: 'Brief description of the company',
    example: 'We are a fintech startup focused on digital payments',
  })
  @IsString()
  @IsNotEmpty()
  briefCompany: string;

  @ApiProperty({
    description: 'Area of expertise',
    example: 'Full-stack development and system architecture',
  })
  @IsString()
  @IsNotEmpty()
  expertiseIn: string;

  @ApiProperty({
    description: 'How the user heard about the service',
    example: 'LinkedIn advertisement',
  })
  @IsString()
  @IsNotEmpty()
  hearAbout: string;
}
