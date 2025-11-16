import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, ChevronLeft, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface MinimalNavbarProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  className?: string;
  onMenuToggle?: () => void;
  transparent?: boolean;
}

const MinimalNavbar: React.FC<MinimalNavbarProps> = ({
  title,
  showBack = true,
  showMenu = true,
  className = '',
  onMenuToggle,
  transparent = false,
}) => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return (
    <header 
      className={`py-2 px-4 flex items-center justify-between ${transparent ? 'bg-transparent' : 'bg-background'} ${transparent ? '' : 'border-b border-border'} ${className}`}
    >
      <div className="flex items-center space-x-4">
        {showBack && (
          <>
            <Link href="/" className="p-2 rounded-full hover:bg-background/80 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <Link href="/" className="p-2 rounded-full hover:bg-background/80 transition-colors">
              <Home className="h-5 w-5" />
            </Link>
          </>
        )}
        
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
      </div>
      
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
          </div>
        )}
        
        {showMenu && onMenuToggle && (
          <button 
            onClick={onMenuToggle}
            className="p-2 rounded-full hover:bg-background/80 transition-colors md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
};

export default MinimalNavbar;
