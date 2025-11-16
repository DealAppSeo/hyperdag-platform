import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import UserAvatar from "../ui/user-avatar";
import { NotificationBell } from "../notifications/notification-bell";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

interface MobileSidebarProps {
  onClose?: () => void;
}

export default function MobileSidebar({ onClose }: MobileSidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  // Handle logout with explicit navigation
  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
    // Close the drawer first if onClose is provided
    if (onClose) {
      onClose();
    }
    // Add a short delay to ensure the backend processes the logout first
    setTimeout(() => {
      window.location.href = '/auth';
    }, 200);
  }, [logoutMutation, onClose]);
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user
  });

  if (!user) return null;

  // Define nav item type with optional highlight property
  type NavItem = {
    href: string;
    icon: string;
    text: string;
    highlight?: boolean;
  };
  
  // Organize navigation items into logical groups optimized for different audiences
  
  // Community & Sharing Items (Mobile-Focused)
  const communityItems: NavItem[] = [
    { href: "/", icon: "home", text: "Home" },
    { href: "/my-dashboard", icon: "user-circle", text: "My Profile", highlight: true },
    { href: "/refer", icon: "share", text: "Referrals", highlight: true },
    { href: "/rewards", icon: "coins", text: "Rewards & Leaderboard", highlight: true },
    { href: "/projects", icon: "briefcase", text: "Projects", highlight: true },
    { href: "/hypercrowd", icon: "users", text: "HyperCrowd" },
    { href: "/learning", icon: "lightbulb", text: "Learning" },
    { href: "/definitions", icon: "book-open", text: "What is a DAG?" },
  ];
  
  // Developer & Technical Items (Desktop-Focused)
  const devItems: NavItem[] = [
    { href: "/grantflow", icon: "clipboard", text: "GrantFlow", highlight: true },
    { href: "/ai-enhancement", icon: "brain", text: "AI Tools" },
    { href: "/reputation-id", icon: "shield", text: "Reputation" },
    { href: "/developer", icon: "code", text: "Developer Dashboard" },
    { href: "/zkp", icon: "lock", text: "ZKP & Privacy" },
    { href: "/projects", icon: "briefcase", text: "Projects" },
    { href: "/about", icon: "info", text: "About HyperDAG" },
    { href: "/settings", icon: "settings", text: "Settings" },
  ];
  
  // Combine items with community first for mobile
  const mainNavItems = [...communityItems, ...devItems];
  
  const handleNavigation = (href: string) => {
    // Close the drawer first if onClose is provided
    if (onClose) {
      onClose();
    }
    // Then navigate
    window.location.href = href;
  };

  return (
    <div className="flex flex-col h-full">
      {/* User Profile Preview */}
      <div className="mx-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserAvatar username={user.username} />
            <div className="ml-3">
              <h3 className="font-semibold text-lg">{user.username}</h3>
              <p className="text-gray-500 text-sm flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Online
              </p>
            </div>
          </div>
          <NotificationBell />
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Balance</p>
            <p className="font-semibold text-primary">{user.tokens} HDAG</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Level</p>
            <p className="font-semibold text-accent">Contributor</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="px-4 flex-1 overflow-y-auto">
        {/* Community Section - Mobile-First Design */}
        <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 ml-2">Community & Sharing</h2>
        <ul className="mb-6">
          {communityItems.map((item) => (
            <li key={item.href} className="mb-1">
              <button 
                onClick={() => handleNavigation(item.href)}
                className={`block w-full text-left px-4 py-2 rounded-md font-medium ${
                  location === item.href 
                    ? 'text-white bg-primary' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-3 ${item.highlight ? 'text-primary' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon === 'home' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
                    {item.icon === 'heart' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
                    {item.icon === 'share' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />}
                    {item.icon === 'coins' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    {item.icon === 'link' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />}
                    {item.icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                    {item.icon === 'lightbulb' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />}
                    {item.icon === 'bar-chart' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                    {item.icon === 'book-open' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                  </svg>
                  <span className={item.highlight ? 'font-semibold text-primary' : ''}>{item.text}</span>
                  {item.highlight && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
        
        {/* Developer Section - Desktop-Focused */}
        <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 ml-2 mt-2">Developer Tools</h2>
        <ul className="mb-6">
          {devItems.map((item) => (
            <li key={item.href} className="mb-1">
              <button 
                onClick={() => handleNavigation(item.href)}
                className={`block w-full text-left px-4 py-2 rounded-md font-medium ${
                  location === item.href 
                    ? 'text-white bg-primary' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon === 'clipboard' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />}
                    {item.icon === 'briefcase' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                    {item.icon === 'shield' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />}
                    {item.icon === 'settings' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
                    {item.icon === 'info' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    {item.icon === 'brain' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />}
                    {item.icon === 'code' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />}
                    {item.icon === 'lock' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                  </svg>
                  <span>{item.text}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Sign Out Link */}
      <div className="p-4 border-t border-gray-200">
        <button 
          className="w-full text-gray-600 hover:text-gray-900 font-medium py-2 px-4 rounded-md flex items-center justify-center"
          onClick={handleLogout}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}