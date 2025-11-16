import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderColor?: string;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderColor = '#f3f4f6',
  lazy = true,
  onLoad,
  onError,
  fallbackSrc
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    onError?.();
  };

  // Style for placeholder
  const placeholderStyle = {
    backgroundColor: placeholderColor,
    aspectRatio: width && height ? `${width}/${height}` : undefined
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : 'auto' }}
    >
      {/* Placeholder */}
      {!loaded && (
        <div 
          className="absolute inset-0 animate-pulse"
          style={placeholderStyle}
        />
      )}
      
      {/* Actual image */}
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        className={`${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${error && !fallbackSrc ? 'hidden' : 'block'}`}
        style={{ objectFit: 'cover' }}
      />

      {/* Error state with fallback */}
      {error && !fallbackSrc && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-muted"
          style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
        >
          <span className="text-muted-foreground text-sm">Unable to load image</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;