import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import UserAvatar from "../ui/user-avatar";
import { NotificationBell } from "../notifications/notification-bell";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback } from "react";
import AccordionNav from './accordion-nav';
import { coreNavigationItems, mobileBottomNavItems } from './navigation-config';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user
  });

  if (!user) return null;
  
  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
    onClose();
    // Add a short delay to ensure the backend processes the logout first
    setTimeout(() => {
      window.location.href = '/auth';
    }, 200);
  }, [logoutMutation, onClose]);

  const navItems = [
    { href: "/", icon: "home", text: "Dashboard" },
    { href: "/grant-flow", icon: "clipboard", text: "Projects & Grants" },
    { href: "/reputation", icon: "shield", text: "Reputation" },
    { href: "/community", icon: "users", text: "Community Hub" },
    { href: "/learning", icon: "lightbulb", text: "Learning" },
    { href: "/refer", icon: "share", text: "Refer Friends" },
    { href: "/profile", icon: "settings", text: "Settings" },
  ];

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-75 z-20 md:hidden ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white h-full w-3/4 max-w-xs p-4 animate-in slide-in-from-left">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
            </svg>
            <h1 className="ml-2 text-xl font-bold text-primary">HyperDAG</h1>
          </div>
          <button className="text-gray-500 hover:text-primary" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* User Profile Preview */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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
              <p className="text-xs text-gray-500">Referrals</p>
              <p className="font-semibold text-secondary">{userStats && typeof userStats === 'object' && userStats !== null && 'referralStats' in userStats && userStats.referralStats && typeof userStats.referralStats === 'object' && 'level1' in userStats.referralStats ? String(userStats.referralStats.level1) : '0'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Level</p>
              <p className="font-semibold text-accent">Contributor</p>
            </div>
          </div>
        </div>
        
        {/* Accordion-style Navigation */}
        <div className="overflow-y-auto max-h-[60vh]">
          <AccordionNav 
            navigationItems={coreNavigationItems}
            personaColor="primary" 
            className="px-2 py-3" 
            onClose={onClose} 
          />
        </div>
        
        {/* Quick links */}
        <nav className="mt-6">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Quick Links</h3>
          <ul>
            {navItems.map((item) => (
              <li key={item.href} className="mb-1">
                <Link 
                  href={item.href}
                  onClick={onClose}
                  className={`block px-4 py-2 rounded-md font-medium ${
                    location === item.href 
                      ? 'text-white bg-primary' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {item.icon === 'home' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
                      {item.icon === 'clipboard' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />}
                      {item.icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                      {item.icon === 'shield' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />}
                      {item.icon === 'lightbulb' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />}
                      {item.icon === 'settings' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
                    </svg>
                    {item.text}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Connect Wallet Button */}
        <div className="mt-6">
          <button className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Connect Wallet
          </button>
        </div>
        
        {/* Sign Out Link */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button 
            className="block w-full text-center text-gray-500 hover:text-gray-700"
            onClick={handleLogout}
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const [location] = useLocation();
  
  // Import mobileBottomNavItems from the navigation config
  const navItems = mobileBottomNavItems;

  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-2 ${
              location === item.href ? 'text-primary font-medium' : 'text-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {item.icon === 'home' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
              {item.icon === 'clipboard' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />}
              {item.icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
              {item.icon === 'coins' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
              {item.icon === 'user' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
              {item.icon === 'layers' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />}
              {item.icon === 'shield' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />}
              {item.icon === 'lightbulb' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />}
            </svg>
            <span className="text-xs mt-1">{item.text}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

MobileNav.BottomNav = BottomNav;

export default MobileNav;
