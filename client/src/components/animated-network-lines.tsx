import React, { useEffect, useRef } from 'react';

interface AnimatedNetworkLinesProps {
  className?: string;
}

const AnimatedNetworkLines: React.FC<AnimatedNetworkLinesProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Network node configuration
    const nodes: Node[] = [];
    const nodeCount = 8;
    const maxConnections = 3;
    
    // Create initial nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 4 + Math.random() * 2,
        vx: Math.random() * 0.3 - 0.15,
        vy: Math.random() * 0.3 - 0.15,
        color: getNodeColor(i),
        connections: []
      });
    }
    
    // Create connections between nodes
    for (let i = 0; i < nodes.length; i++) {
      const connectionCount = Math.floor(Math.random() * maxConnections) + 1;
      
      for (let j = 0; j < connectionCount; j++) {
        let targetNodeIndex;
        do {
          targetNodeIndex = Math.floor(Math.random() * nodes.length);
        } while (targetNodeIndex === i || nodes[i].connections.includes(targetNodeIndex));
        
        nodes[i].connections.push(targetNodeIndex);
      }
    }
    
    // Create animated data packets
    const packets: Packet[] = [];
    const maxPackets = 15;
    
    // Animation loop
    let animationFrame: number;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        for (const connectionIndex of node.connections) {
          const targetNode = nodes[connectionIndex];
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle = 'rgba(150, 150, 150, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      
      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // Update position
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounce off edges
        if (node.x < node.radius || node.x > canvas.width - node.radius) {
          node.vx *= -1;
        }
        if (node.y < node.radius || node.y > canvas.height - node.radius) {
          node.vy *= -1;
        }
        
        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      }
      
      // Create new packets randomly
      if (packets.length < maxPackets && Math.random() < 0.05) {
        const sourceNodeIndex = Math.floor(Math.random() * nodes.length);
        const sourceNode = nodes[sourceNodeIndex];
        
        if (sourceNode.connections.length > 0) {
          const targetNodeIndex = sourceNode.connections[Math.floor(Math.random() * sourceNode.connections.length)];
          
          packets.push({
            sourceNode: sourceNodeIndex,
            targetNode: targetNodeIndex,
            progress: 0,
            speed: 0.01 + Math.random() * 0.02,
            color: Math.random() > 0.7 ? '#3b82f6' : (Math.random() > 0.5 ? '#10b981' : '#8b5cf6')
          });
        }
      }
      
      // Update and draw packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const packet = packets[i];
        packet.progress += packet.speed;
        
        if (packet.progress >= 1) {
          // Remove completed packets
          packets.splice(i, 1);
          continue;
        }
        
        const sourceNode = nodes[packet.sourceNode];
        const targetNode = nodes[packet.targetNode];
        
        // Interpolate position
        const x = sourceNode.x + (targetNode.x - sourceNode.x) * packet.progress;
        const y = sourceNode.y + (targetNode.y - sourceNode.y) * packet.progress;
        
        // Draw packet
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = packet.color;
        ctx.fill();
      }
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full ${className}`}
      style={{ background: 'transparent' }}
    />
  );
};

// Helper function to get node colors
function getNodeColor(index: number): string {
  const colors = [
    '#10b981', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#6366f1'  // Indigo
  ];
  
  return colors[index % colors.length];
}

// Types
interface Node {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
  connections: number[];
}

interface Packet {
  sourceNode: number;
  targetNode: number;
  progress: number;
  speed: number;
  color: string;
}

export default AnimatedNetworkLines;