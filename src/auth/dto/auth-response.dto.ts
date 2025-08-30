export class RegisterResponse {
  id: string;
  email: string;
  fullName?: string | null;  
  accountName?: string | null;  
  currentStep: string;
  nextStepUrl: string;
}

export class OnboardingResponse {
  id: string;
  email: string;
  fullName?: string | null; 
  accountName?: string | null; 
  currentStep: string;
  completedSteps: string[];
  registrationComplete: boolean;
}



export class LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName?: string | null;
    accountName?: string | null;
    domain: string | null;
  };
  expiresIn: number;
}