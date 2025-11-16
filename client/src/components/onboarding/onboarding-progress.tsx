import React from 'react';
import { User } from '@shared/schema';
import {
  CheckCircle2Icon,
  CircleIcon,
  LockIcon,
  KeyIcon,
  MailIcon,
  MailCheckIcon,
  UserIcon,
  WalletIcon
} from 'lucide-react';

interface OnboardingProgressProps {
  user: User;
  currentStep?: number; // Override for display purposes
}

export function OnboardingProgress({ user, currentStep }: OnboardingProgressProps) {
  // Use passed currentStep or user's onboardingStage (fallback to 1 if not found)
  const stage = currentStep || user?.onboardingStage || 1;
  
  const steps = [
    { 
      id: 1, 
      name: 'Alias', 
      description: 'Basic identity',
      icon: UserIcon,
      color: 'text-blue-500'
    },
    { 
      id: 2, 
      name: 'Email', 
      description: 'Communication',
      icon: MailIcon,
      color: 'text-orange-500'
    },
    { 
      id: 3, 
      name: 'Verify', 
      description: 'Email verified',
      icon: MailCheckIcon,
      color: 'text-green-500'
    },
    { 
      id: 4, 
      name: '2FA', 
      description: 'Enhanced security',
      icon: KeyIcon,
      color: 'text-purple-500'
    },
    { 
      id: 5, 
      name: 'Wallet', 
      description: 'Web3 integration',
      icon: WalletIcon,
      color: 'text-yellow-500'
    },
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg font-semibold mb-2 sm:mb-0">Onboarding Progress</h3>
        <div className="text-sm text-gray-500">
          {stage < 5 ? `${stage} of 5 completed` : "All steps completed!"}
        </div>
      </div>
      
      <div className="relative">
        {/* Progress Bar */}
        <div className="hidden sm:block h-1 bg-gray-200 absolute top-6 left-0 right-0 -mx-2">
          <div 
            className="h-full bg-primary transition-all" 
            style={{ width: `${Math.max(0, (stage - 1) / 4) * 100}%` }}
          />
        </div>
        
        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = stage >= step.id;
            const isCurrent = stage === step.id;
            
            return (
              <div 
                key={step.id} 
                className={`flex flex-col items-center text-center ${step.id > 1 ? 'sm:border-t-0' : ''}`}
              >
                {/* Icon */}
                <div className={`
                  relative flex items-center justify-center w-12 h-12 rounded-full 
                  ${isActive ? step.color : 'text-gray-300'} 
                  ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                  transition-all duration-300 ease-in-out
                  bg-white
                `}>
                  {isActive ? (
                    step.id < stage ? (
                      <CheckCircle2Icon className="w-10 h-10" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )
                  ) : (
                    <div className="flex items-center justify-center">
                      <CircleIcon className="w-10 h-10" />
                      <LockIcon className="w-4 h-4 absolute" />
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <div className="mt-3">
                  <div className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.name}
                  </div>
                  <div className={`text-xs mt-1 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
