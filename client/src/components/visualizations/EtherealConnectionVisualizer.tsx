import React, { useRef, useEffect, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
}

interface EtherealConnectionVisualizerProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  colorTheme?: 'default' | 'blue' | 'green' | 'orange' | 'rainbow';
  interactive?: boolean;
  density?: 'low' | 'medium' | 'high';
}

const getColorForTheme = (theme: string, index: number = 0): string => {
  const themes = {
    default: ['#4F46E5', '#6366F1', '#818CF8', '#2563EB'],
    blue: ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA'],
    green: ['#047857', '#059669', '#10B981', '#34D399'],
    orange: ['#B45309', '#D97706', '#F59E0B', '#FBBF24'],
    rainbow: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
  };
  
  const themeColors = themes[theme as keyof typeof themes] || themes.default;
  return themeColors[index % themeColors.length];
};

export const EtherealConnectionVisualizer: React.FC<EtherealConnectionVisualizerProps> = ({
  className = '',
  particleCount = 60,
  connectionDistance = 120,
  colorTheme = 'default',
  interactive = true,
  density = 'medium'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);
  const animationRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);
  
  // Set particle density based on the density prop
  const getParticleCount = () => {
    const baseCounts = {
      low: particleCount * 0.5,
      medium: particleCount,
      high: particleCount * 2
    };
    return Math.round(baseCounts[density]);
  };

  // Initialize particles
  const initParticles = () => {
    if (!canvasRef.current) return [];
    
    const { width, height } = canvasRef.current;
    const count = getParticleCount();
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        color: getColorForTheme(colorTheme, i),
        opacity: Math.random() * 0.5 + 0.3
      });
    }
    
    return newParticles;
  };

  // Update particles position
  const updateParticles = () => {
    if (!canvasRef.current) return;
    
    const { width, height } = canvasRef.current;
    
    setParticles(prevParticles => {
      return prevParticles.map(particle => {
        let { x, y, speedX, speedY } = particle;
        
        // Update position
        x += speedX;
        y += speedY;
        
        // Bounce off edges
        if (x < 0 || x > width) speedX *= -1;
        if (y < 0 || y > height) speedY *= -1;
        
        // Keep particles within bounds
        x = Math.max(0, Math.min(width, x));
        y = Math.max(0, Math.min(height, y));
        
        return { ...particle, x, y, speedX, speedY };
      });
    });
  };

  // Draw particles and connections
  const drawCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw particles
    particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      ctx.fill();
    });
    
    // Draw connections
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < connectionDistance) {
          const opacity = 1 - (distance / connectionDistance);
          ctx.strokeStyle = particles[i].color;
          ctx.globalAlpha = opacity * 0.2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
      
      // Connect to mouse if interactive is enabled
      if (interactive && mousePosition) {
        const dx = particles[i].x - mousePosition.x;
        const dy = particles[i].y - mousePosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < connectionDistance * 1.5) {
          const opacity = 1 - (distance / (connectionDistance * 1.5));
          ctx.strokeStyle = particles[i].color;
          ctx.globalAlpha = opacity * 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mousePosition.x, mousePosition.y);
          ctx.stroke();
        }
      }
    }
  };

  // Animation loop
  const animate = () => {
    updateParticles();
    drawCanvas();
    requestRef.current = requestAnimationFrame(animate);
  };

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const parent = canvasRef.current.parentElement;
        const { width, height } = parent.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle mouse movement for interactive mode
  useEffect(() => {
    if (!interactive || !canvasRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const handleMouseLeave = () => {
      setMousePosition(null);
    };

    canvasRef.current.addEventListener('mousemove', handleMouseMove);
    canvasRef.current.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
        canvasRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [interactive]);

  // Initialize particles when dimensions change
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      setParticles(initParticles());
    }
  }, [dimensions]);

  // Start/stop animation
  useEffect(() => {
    if (particles.length > 0 && !requestRef.current) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [particles]);

  return (
    <div className={`ethereal-connection-visualizer ${className}`} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default EtherealConnectionVisualizer;
