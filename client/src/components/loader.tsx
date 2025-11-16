import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullPage?: boolean;
}

const LoaderComponent: React.FC<LoaderProps> = ({ 
  size = 'md', 
  text, 
  fullPage = false 
}) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const spinner = (
    <Loader2 className={`${sizeMap[size]} animate-spin text-primary`} />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
        {text && <p className="mt-4 text-muted-foreground">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {spinner}
      {text && <p className="mt-2 text-muted-foreground text-sm">{text}</p>}
    </div>
  );
};

export default LoaderComponent;