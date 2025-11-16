import { ChevronLeft } from "lucide-react";

interface MobileStepHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description?: string;
  onBack?: () => void;
}

export default function MobileStepHeader({ 
  currentStep, 
  totalSteps,
  title,
  description,
  onBack 
}: MobileStepHeaderProps) {
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };
  
  return (
    <div className="md:hidden sticky top-[53px] z-20 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={handleBack}
          className="p-1 -ml-1 rounded-md hover:bg-gray-100 focus:outline-none"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <span className="text-sm text-gray-500 font-medium">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <h1 className="text-xl font-bold">{title}</h1>
      {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
    </div>
  );
}