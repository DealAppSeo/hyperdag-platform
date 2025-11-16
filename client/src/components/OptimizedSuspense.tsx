import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface OptimizedSuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minDelay?: number;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
);

export const OptimizedSuspense: React.FC<OptimizedSuspenseProps> = ({
  children,
  fallback = <LoadingSpinner />,
  minDelay = 100
}) => {
  const [showFallback, setShowFallback] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, minDelay);

    return () => clearTimeout(timer);
  }, [minDelay]);

  return (
    <Suspense fallback={showFallback ? fallback : <div className="h-4" />}>
      {children}
    </Suspense>
  );
};

export default OptimizedSuspense;