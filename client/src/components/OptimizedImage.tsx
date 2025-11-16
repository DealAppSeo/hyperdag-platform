import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
  errorClassName?: string;
  lowQualitySrc?: string;
  loadingPlaceholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * A component that optimizes image loading with blur-up effect, 
 * error handling, and responsive behavior
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderClassName = 'animate-pulse bg-muted',
  errorClassName = 'bg-destructive/10',
  lowQualitySrc,
  loadingPlaceholder,
  errorPlaceholder,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [transitionComplete, setTransitionComplete] = useState(false);
  
  // Reset states when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setTransitionComplete(false);
  }, [src]);
  
  // Handle successful image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
    
    // Add a small delay before completing the transition
    setTimeout(() => {
      setTransitionComplete(true);
    }, 300);
  };
  
  // Handle image loading error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };
  
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
  };
  
  return (
    <div style={containerStyle} className={cn('relative overflow-hidden', className)}>
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center', 
            placeholderClassName
          )}
        >
          {loadingPlaceholder || (
            lowQualitySrc ? (
              <img 
                src={lowQualitySrc}
                alt={alt}
                className="w-full h-full object-cover blur-md opacity-50"
                aria-hidden="true"
              />
            ) : null
          )}
        </div>
      )}
      
      {/* Error placeholder */}
      {hasError && (
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center text-center p-2',
            errorClassName
          )}
        >
          {errorPlaceholder || (
            <span className="text-sm text-muted-foreground">
              Unable to load image
            </span>
          )}
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          !isLoaded && 'opacity-0',
          isLoaded && 'opacity-100',
          hasError && 'hidden',
          transitionComplete && 'fade-in-complete'
        )}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;