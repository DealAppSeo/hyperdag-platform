import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import UserAvatar from "../ui/user-avatar";
import { NotificationBell } from "../notifications/notification-bell";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { UserProfileIcon } from "../icons/user-profile-icon";
import { Web3Icon } from "../icons/web3-icon";

// Define types for navigation items with optional badge and click handler
interface NavItem {
  href: string;
  icon: string;
  text: string;
  badge?: {
    variant: string;
    text: string;
  };
  onClick?: (e: React.MouseEvent) => void;
}

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  // Handle logout with explicit navigation
  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
    // Add a short delay to ensure the backend processes the logout first
    setTimeout(() => {
      window.location.href = '/auth';
    }, 200);
  }, [logoutMutation]);

  // Fetch user stats for sidebar display
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    retry: false,
  });

  // Get user-friendly icon based on icon name
  const getIcon = (icon: string) => {
    switch (icon) {
      case 'dashboard':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
      case 'project':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />;
      case 'grantflow':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />;
      case 'heart':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />;
      case 'marketplace':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 3H3m4 10v6a1 1 0 001 1h1m0-6a1 1 0 011 1v5h1a1 1 0 001-1v-5a1 1 0 011-1m-7 6h.01" />;
      case 'resources':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />;
      case 'users':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />;
      case 'plus-circle':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'megaphone':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />;
      case 'share':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />;
      case 'coins':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'bar-chart':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
      case 'lightbulb':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />;
      case 'book-open':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />;
      case 'link':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />;
      case 'code':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />;
      case 'lock':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />;
      case 'shield':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
      case 'bot':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082c.313.03.618.074.911.13.82.149 1.556.456 2.139.848l1.9-1.9A.75.75 0 0115.75 3H18a.75.75 0 01.75.75V9a.75.75 0 01-1.28.53l-1.89-1.89c-.46.238-.882.516-1.282.825m-8.63 4.86C4.974 12.988 4.276 13.578 3.5 14.5v5.25a.75.75 0 001.5 0v-5.25c.161-.198.338-.384.528-.559m0 0a7.518 7.518 0 01-.01-.01m.01.01a7.285 7.285 0 012.566-1.504m0 0a6.726 6.726 0 01.58-.114m-.58.114a6.772 6.772 0 01-.58.114M15 9.75a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0115 9.75z" />;
      case 'bell':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />;
      case 'database':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />;
      case 'clipboard':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />;
      case 'user-profile':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
      case 'file-text':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
      case 'brain':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082c.313.03.618.074.911.13.82.149 1.556.456 2.139.848l1.9-1.9A.75.75 0 0115.75 3H18a.75.75 0 01.75.75V9a.75.75 0 01-1.28.53l-1.89-1.89c-.46.238-.882.516-1.282.825m-8.63 4.86C4.974 12.988 4.276 13.578 3.5 14.5v5.25a.75.75 0 001.5 0v-5.25c.161-.198.338-.384.528-.559m0 0a7.518 7.518 0 01-.01-.01m.01.01a7.285 7.285 0 012.566-1.504m0 0a6.726 6.726 0 01.58-.114m-.58.114a6.772 6.772 0 01-.58.114M15 9.75a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0115 9.75z" />;
      // Add any other icons needed
      default:
        return null;
    }
  };

  // Get badge color based on variant
  const getBadgeColor = (variant: string) => {
    switch (variant) {
      case 'blue': return 'bg-blue-100 text-blue-800';
      case 'green': return 'bg-green-100 text-green-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'red': return 'bg-red-100 text-red-800';
      case 'purple': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Define navigation items for main features (mobile-first, simplified)
  const mainItems: NavItem[] = [
    { href: "/", icon: "dashboard", text: "Dashboard" },
    { href: "/purpose-hub", icon: "heart", text: "Purpose Hub", 
      badge: { variant: "purple", text: "Impact" } },
    { href: "/nonprofits", icon: "heart", text: "Nonprofits", 
      badge: { variant: "green", text: "Verified" } },
    { href: "/grantflow", icon: "grantflow", text: "GrantFlow", 
      badge: { variant: "green", text: "AI-Powered" } },
  ];

  // Community navigation items (mobile-friendly)
  const communityItems: NavItem[] = [
    { href: "/hypercrowd", icon: "users", text: "HyperCrowd Teams", 
      badge: { variant: "blue", text: "Zero-Trust" } },
    { href: "/refer", icon: "share", text: "Refer Friends", 
      badge: { variant: "green", text: "90-98%" } },
    { href: "/referral-revenue", icon: "database", text: "Revenue Dashboard", 
      badge: { variant: "purple", text: "ANFIS" } },
  ];

  // Profile management items
  const profileItems: NavItem[] = [
    { href: "/my-dashboard", icon: "user-profile", text: "Profile Overview" },
    { href: "/superpower", icon: "lightbulb", text: "SuperPower Discovery", 
      badge: { variant: "yellow", text: "Ikigai" } },
    { href: "/zkp-credentials", icon: "shield", text: "Identity & Credentials", 
      badge: { variant: "purple", text: "Verified" } },
  ];

  // Developer tools (collapsible section for technical features)
  const developerTools: NavItem[] = [
    { href: "/anfis-ai", icon: "brain", text: "ANFIS AI Router", 
      badge: { variant: "purple", text: "Fuzzy Logic" } },
    { href: "/automated-resource-sharing", icon: "resources", text: "ANFIS Optimization", 
      badge: { variant: "blue", text: "AI" } },
    { href: "/developer", icon: "code", text: "AI-Web3 Scaffolding", 
      badge: { variant: "purple", text: "Natural Language" } },
    { href: "/developer/api-docs", icon: "book-open", text: "Hybrid DAG APIs", 
      badge: { variant: "blue", text: "2.4M TPS" } },
    { href: "/developer/navigation-webhooks", icon: "bell", text: "Cross-Chain Integration", 
      badge: { variant: "green", text: "Universal" } },
    { href: "/developer/forum-storage", icon: "database", text: "Quantum Storage", 
      badge: { variant: "purple", text: "CRYSTALS" } },
    { href: "/developer/zkp", icon: "lock", text: "ZKP-NFT Tools", 
      badge: { variant: "yellow", text: "Selective Disclosure" } },
  ];

  // State for collapsible sections
  const [isDeveloperToolsOpen, setIsDeveloperToolsOpen] = useState(false);

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 w-64 border-r border-gray-200 bg-white h-screen overflow-y-auto z-40">
      <div className="p-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
        </svg>
        <h1 className="ml-2 text-xl font-bold text-primary">HyperDAG</h1>
      </div>
      
      {/* User Profile Preview */}
      <div className="mx-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {user && <UserAvatar username={user.username} />}
            <div className="ml-3">
              <h3 className="font-semibold text-lg">{user?.username || 'Guest'}</h3>
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
            <p className="font-semibold text-primary">{user?.tokens || 0} HDAG</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Referrals</p>
            <p className="font-semibold text-secondary">{userStats && typeof userStats === 'object' && userStats !== null && 'referralStats' in userStats && userStats.referralStats && typeof userStats.referralStats === 'object' && 'level1' in userStats.referralStats ? String(userStats.referralStats.level1) : '0'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Level</p>
            <p className="font-semibold text-accent">Contributor</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Sections in Hierarchical Order */}
      <div className="px-3">
        {/* Main Navigation - Top Priority */}
        <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 ml-2">Main</h2>
        <ul className="mb-6">
          {mainItems.map((item) => (
            <li key={item.href} className="mb-1">
              <Link 
                to={item.href}
                className={`block px-4 py-2 rounded-md font-medium ${
                  location === item.href 
                    ? 'text-white bg-primary' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  {item.icon === 'user-profile' ? (
                    <UserProfileIcon />
                  ) : item.icon === 'layers' ? (
                    <Web3Icon />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {getIcon(item.icon)}
                    </svg>
                  )}
                  <div className="flex items-center">
                    {item.text}
                    {item.badge && (
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md bg-${item.badge.variant}-100 text-${item.badge.variant}-700 border border-${item.badge.variant}-200 font-medium`}>
                        {item.badge.text}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        {/* Community Section - Middle Priority */}
        <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 ml-2 mt-4">Community</h2>
        <ul className="mb-6">
          {/* Forum link (direct HTML to avoid router issues) */}
          <li className="mb-1">
            <a
              href="https://forum.hyperdag.org"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {getIcon("megaphone")}
                </svg>
                HyperVerse Forum
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200 font-medium">
                  New
                </span>
              </div>
            </a>
          </li>
          
          {/* Regular internal navigation items */}
          {communityItems.map((item) => (
            <li key={item.href} className="mb-1">
              <Link 
                to={item.href}
                className={`block px-4 py-2 rounded-md font-medium ${
                  location === item.href 
                    ? 'text-white bg-primary' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  {item.icon === 'layers' ? (
                    <Web3Icon />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {getIcon(item.icon)}
                    </svg>
                  )}
                  {item.text}
                  {item.badge && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${getBadgeColor(item.badge.variant)}`}>
                      {item.badge.text}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        {/* Profile Section */}
        <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 ml-2 mt-4">Profile</h2>
        <ul className="mb-6">
          {profileItems.map((item) => (
            <li key={item.href} className="mb-1">
              <Link 
                to={item.href}
                className={`block px-4 py-2 rounded-md font-medium ${
                  location === item.href 
                    ? 'text-white bg-primary' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  {item.icon === 'user-profile' ? (
                    <UserProfileIcon />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {getIcon(item.icon)}
                    </svg>
                  )}
                  {item.text}
                  {item.badge && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${getBadgeColor(item.badge.variant)}`}>
                      {item.badge.text}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        {/* Developer Tools Section - Collapsible */}
        <div className="mt-4">
          <button
            onClick={() => setIsDeveloperToolsOpen(!isDeveloperToolsOpen)}
            className="flex items-center justify-between w-full px-2 py-1 text-xs uppercase tracking-wider text-gray-500 font-semibold hover:text-gray-700"
          >
            Developer Tools
            {isDeveloperToolsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {isDeveloperToolsOpen && (
            <ul className="mt-2 mb-6">
                {developerTools.map((item) => (
                  <li key={item.href} className="mb-1">
                    <Link 
                      to={item.href}
                      className={`block px-4 py-2 rounded-md font-medium ${
                        location === item.href 
                          ? 'text-white bg-primary' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {getIcon(item.icon)}
                        </svg>
                        {item.text}
                      </div>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </div>
        
        {/* Admin Section - Collapsible, Only visible to admins */}
        {user?.isAdmin && (
          <div className="mt-4">
            <button
              className="flex items-center justify-between w-full px-2 py-1 text-xs uppercase tracking-wider text-gray-500 font-semibold hover:text-gray-700"
            >
              Admin Panel
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </button>
            <ul className="mt-2 mb-6">
              <li className="mb-1">
                <Link 
                  to="/admin"
                  className={`block px-4 py-2 rounded-md font-medium ${
                    location === '/admin' 
                      ? 'text-white bg-primary' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Logout Button */}
      <div className="mt-auto p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}