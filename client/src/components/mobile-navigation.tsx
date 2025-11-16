import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Home,
  Heart,
  Award,
  User,
  Settings
} from 'lucide-react';

/**
 * Mobile-friendly navigation bar that appears at the bottom of the screen
 * on small devices only
 */
export default function MobileNavigation() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide navigation when scrolling down, show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div 
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="grid grid-cols-5 gap-1">
        <NavItem 
          href="/" 
          icon={<Home size={20} />} 
          label="Home" 
          active={location === '/'} 
        />
        <NavItem 
          href="/nonprofits" 
          icon={<Heart size={20} />} 
          label="Nonprofits" 
          active={location.startsWith('/nonprofit')} 
          highlight={true}
        />
        <NavItem 
          href="/rewards" 
          icon={<Award size={20} />} 
          label="Rewards" 
          active={location === '/rewards'} 
        />
        <NavItem 
          href="/my-dashboard" 
          icon={<User size={20} />} 
          label="Profile" 
          active={location === '/my-dashboard'} 
        />
        <NavItem 
          href="/settings" 
          icon={<Settings size={20} />} 
          label="Settings" 
          active={location === '/settings'} 
        />
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  highlight?: boolean;
}

function NavItem({ href, icon, label, active, highlight }: NavItemProps) {
  return (
    <Link to={href}>
      <div className={`flex flex-col items-center justify-center py-2 ${
        active ? 'text-blue-600' : 'text-gray-500'
      }`}>
        <div className={`p-1 ${highlight && !active ? 'relative' : ''}`}>
          {highlight && !active && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          )}
          {icon}
        </div>
        <span className="text-xs mt-1">{label}</span>
      </div>
    </Link>
  );
}