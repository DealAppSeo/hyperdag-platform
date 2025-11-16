import React, { ReactNode } from 'react';
import EtherealConnectionVisualizer from './EtherealConnectionVisualizer';

interface EtherealContainerProps {
  children?: ReactNode;
  className?: string;
  height?: string | number;
  colorTheme?: 'default' | 'blue' | 'green' | 'orange' | 'rainbow';
  particleCount?: number;
  density?: 'low' | 'medium' | 'high';
  overlay?: boolean;
  style?: React.CSSProperties;
}

export const EtherealContainer: React.FC<EtherealContainerProps> = ({
  children,
  className = '',
  height = '100%',
  colorTheme = 'default',
  particleCount = 60,
  density = 'medium',
  overlay = true,
  style = {}
}) => {
  return (
    <div 
      className={`ethereal-container relative ${className}`} 
      style={{ 
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'hidden',
        ...style
      }}
    >
      <div className="ethereal-background absolute inset-0 z-0">
        <EtherealConnectionVisualizer 
          colorTheme={colorTheme}
          particleCount={particleCount}
          density={density}
        />
      </div>
      
      {overlay && (
        <div className="ethereal-overlay absolute inset-0 z-10 bg-gradient-to-tr from-background/60 to-background/20"></div>
      )}
      
      <div className="ethereal-content relative z-20 h-full">
        {children}
      </div>
    </div>
  );
};

export default EtherealContainer;
