import { useLocation } from "wouter";
import { 
  Home, 
  ClipboardList, 
  Users, 
  Coins, 
  User, 
  Briefcase, 
  Settings,
  Link,
  Share,
  Award,
  UserCircle
} from "lucide-react";
import { mobileBottomNavItems } from "./navigation-config";

export default function BottomNav() {
  const [location] = useLocation();

  const handleNavigation = (path: string) => {
    // Force navigation with window.location for more reliable mobile navigation
    window.location.href = path;
  };

  // Add visual indicator for active item
  const getActiveClass = (path: string) => {
    // Handle special cases for nested routes
    if (path === '/projects' && (location.startsWith('/grant-flow') || location.startsWith('/projects'))) {
      return 'text-primary font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary';
    }
    
    if (path === '/social-connections' && (location.startsWith('/social-connections') || location.startsWith('/hypercrowd'))) {
      return 'text-primary font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary';
    }
    
    if (path === '/settings' && (location.startsWith('/settings') || location.startsWith('/account'))) {
      return 'text-primary font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary';
    }
    
    return location === path 
      ? 'text-primary font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' 
      : 'text-gray-600';
  };

  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-40 shadow-lg">
      <div className="flex justify-around">
        {mobileBottomNavItems.map((item) => (
          <button 
            key={item.href}
            onClick={() => handleNavigation(item.href)}
            className={`relative flex flex-col items-center py-3 px-3 transition-colors ${getActiveClass(item.href)}`}
            aria-label={item.text}
          >
            {item.icon === 'home' && <Home className="h-5 w-5" />}
            {item.icon === 'clipboard' && <ClipboardList className="h-5 w-5" />}
            {item.icon === 'users' && <Users className="h-5 w-5" />}
            {item.icon === 'coins' && <Coins className="h-5 w-5" />} 
            {item.icon === 'user' && <UserCircle className="h-5 w-5" />}
            {item.icon === 'share' && <Share className="h-5 w-5" />}
            {item.icon === 'link' && <Link className="h-5 w-5" />}
            {item.icon === 'award' && <Award className="h-5 w-5" />}
            <span className="text-xs mt-1 font-medium">{item.text}</span>
          </button>
        ))}
      </div>
      {/* Bottom padding to ensure content is not hidden behind navigation */}
      <div className="h-safe-area-bottom bg-white"></div>
    </nav>
  );
}