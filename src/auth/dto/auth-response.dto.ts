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
