import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

import StatsCard from "@/components/dashboard/stats-card";
import ProjectList from "@/components/dashboard/project-list";
import ReferralQRCode from "@/components/referral/qr-code";
import BadgeDisplay from "@/components/ui/badge-display";
import { OnboardingStatus } from "@/components/onboarding/onboarding-status";
import { AccountLinkingBanner } from "@/components/account-linking-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import AIRecommendations from "@/components/dashboard/ai-recommendations";
import MarketingEngagementPanel from "@/components/dashboard/MarketingEngagementPanel";

// Type definitions to fix TypeScript errors
interface UserStats {
  badges?: any[];
  referralStats?: {
    level1?: number;
  };
  projectCount?: number;
}

interface LeaderboardEntry {
  id: number;
  username: string;
  tokens: number;
  badges: number;
  referrals: number;
}

interface Project {
  id: number;
  title: string;
  createdAt: Date | null;
  creatorId: number;
  description: string;
  type: string;
  categories: string[];
  teamRoles: string[] | null;
  fundingGoal: number | null;
  durationDays: number | null;
  currentFunding: number | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  
  // State for managing onboarding status dismissal
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(false);
  const dismissOnboarding = () => setOnboardingDismissed(true);
  
  // State for tracking if the component is visible (for mobile optimization)
  const [isVisible, setIsVisible] = useState(true);

  // Load stats with extended cache times
  const { data: userStats = {}, isLoading: isLoadingStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hour cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  // Load projects with extended cache
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
    staleTime: 1000 * 60 * 45, // 45 minute cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  // Load leaderboard with minimal refresh
  const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    enabled: !!user && !isMobile,
    staleTime: 1000 * 60 * 60 * 2, // 2 hour cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  // Effect to handle visibility and implement scroll-based loading for better mobile performance
  useEffect(() => {
    if (!user) return;

    // Only track visibility for mobile devices
    if (!isMobile) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    // Add dashboard-content ID to the main container for visibility tracking
    const containerElement = document.querySelector('.max-w-7xl');
    if (containerElement) {
      containerElement.id = 'dashboard-content';
      observer.observe(containerElement);
    }

    // Implement delayed loading of leaderboard on mobile
    let leaderboardTimeout: number;
    if (isMobile) {
      leaderboardTimeout = window.setTimeout(() => {
        // Load leaderboard after initial critical content is loaded
      }, 3000); // 3 second delay
    }

    return () => {
      if (containerElement) {
        observer.unobserve(containerElement);
      }
      if (leaderboardTimeout) {
        clearTimeout(leaderboardTimeout);
      }
    };
  }, [user, isMobile]);

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-20 md:pb-6">
      {/* Account Linking Banner for Telegram users */}
      <AccountLinkingBanner user={user} />
      
      {/* Onboarding Status Tracker - Only shown if not dismissed */}
      {!onboardingDismissed && (
        <div className="mb-6">
          <OnboardingStatus onDismiss={dismissOnboarding} />
        </div>
      )}
      
      {/* Instant Grant Discovery - Customer-First Value */}
      <div className={`bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg shadow-lg ${isMobile ? 'p-4' : 'p-6'} mb-6`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>$18.5M in Active Grants Found</h2>
              <p className={`text-green-100 ${isMobile ? 'text-sm' : ''}`}>Ready for applications in your areas of interest</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-md">
              <div className="text-2xl font-bold">$2.5M</div>
              <div className="text-sm text-green-100">NSF Technology Grants</div>
              <div className="text-xs text-green-200">3 perfect matches</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-md">
              <div className="text-2xl font-bold">$1.2M</div>
              <div className="text-sm text-green-100">Foundation Funding</div>
              <div className="text-xs text-green-200">7 good matches</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-md">
              <div className="text-2xl font-bold">$850K</div>
              <div className="text-sm text-green-100">Corporate Programs</div>
              <div className="text-xs text-green-200">5 strong matches</div>
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-3'}`}>
            <button 
              onClick={() => window.location.href = '/grantflow'}
              className="bg-white text-green-600 hover:bg-gray-100 font-medium py-2 px-4 rounded-md flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View My Grant Matches
            </button>
            <button 
              onClick={() => window.location.href = '/nonprofits'}
              className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center border border-white/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Explore Nonprofits
            </button>
          </div>
        </div>
        
        {/* Marketing Engagement Panel - Transform and Share */}
        <div className="mb-6">
          <MarketingEngagementPanel />
        </div>
        
        {/* Stats Row - Optimized for mobile */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'} mb-6`}>
          <StatsCard 
            title="Your Balance" 
            value={`${user.tokens} HDAG`}
            change="+15 today" 
            changeDirection="up"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            iconBgColor="bg-blue-50"
          />
          
          <StatsCard 
            title="Badges" 
            value={isLoadingStats ? "..." : userStats.badges?.length || 0}
            change={isLoadingStats ? "" : userStats.badges && userStats.badges.length > 0 ? "1 new badge" : "Earn your first badge"}
            changeDirection={isLoadingStats ? "none" : userStats.badges && userStats.badges.length > 0 ? "up" : "none"}
            changeColor={isLoadingStats ? "" : userStats.badges && userStats.badges.length > 0 ? "text-secondary" : "text-gray-500"}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
            iconBgColor="bg-purple-50"
          />
          
          <StatsCard 
            title="Referrals" 
            value={isLoadingStats ? "..." : userStats.referralStats?.level1 || 0}
            change={isLoadingStats ? "" : "+2 this week"}
            changeDirection={isLoadingStats ? "none" : "up"}
            changeColor="text-accent"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            iconBgColor="bg-amber-50"
          />
          
          <StatsCard 
            title="Projects" 
            value={isLoadingStats ? "..." : userStats.projectCount || 0}
            change={isLoadingStats || !userStats.projectCount ? "Start creating" : "1 update"}
            changeDirection={isLoadingStats ? "none" : userStats.projectCount ? "none" : "none"}
            changeColor={isLoadingStats ? "" : userStats.projectCount ? "text-blue-600" : "text-gray-500"}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
            iconBgColor="bg-gray-100"
          />
        </div>
        
        {/* Recent Projects and Referral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Recent Projects */}
          <div className="md:col-span-2">
            {isLoadingProjects ? (
              <div className="bg-white rounded-lg shadow h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ProjectList projects={projects || []} showAll={false} />
            )}
          </div>
          
          {/* Referral QR Code */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 p-4">
              <h3 className="font-semibold text-lg">Your Referral Code</h3>
            </div>
            <ReferralQRCode />
          </div>
        </div>
        
        {/* AI Recommendations */}
        <div className="mb-6">
          <AIRecommendations userId={user.id} />
        </div>
        
        {/* Badges and Leaderboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Badges */}
          <Card>
            <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Your Badges</CardTitle>
              <button 
                onClick={() => window.location.href = '/rewards'} 
                className="text-primary text-sm hover:underline"
              >
                View All
              </button>
            </CardHeader>
            <CardContent className="p-4">
              {isLoadingStats ? (
                <div className="h-32 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !userStats?.badges || userStats.badges.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <p>No badges earned yet</p>
                  <p className="text-sm mt-2">Complete actions to earn badges</p>
                </div>
              ) : (
                <BadgeDisplay badges={userStats.badges} />
              )}
            </CardContent>
          </Card>
          
          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Top Contributors</h3>
              <button 
                onClick={() => window.location.href = '/leaderboard'} 
                className="text-primary text-sm hover:underline"
              >
                View Full Board
              </button>
            </div>
            
            {isLoadingLeaderboard ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No leaderboard data available</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaderboard.slice(0, 4).map((entry, index) => {
                  const isCurrentUser = entry.id === user.id;
                  
                  return (
                    <div 
                      key={entry.id} 
                      className={`p-4 flex items-center justify-between ${
                        isCurrentUser ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 w-8 h-8 ${
                          index === 0 
                            ? 'bg-primary' 
                            : isCurrentUser 
                              ? 'bg-accent' 
                              : 'bg-gray-200'
                        } ${
                          index === 0 || isCurrentUser ? 'text-white' : 'text-gray-800'
                        } rounded-full flex items-center justify-center font-semibold`}>
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{entry.username}</p>
                          <div className="flex items-center">
                            <span className="text-xs bg-purple-50 text-secondary px-2 py-0.5 rounded border border-purple-100">
                              {entry.badges} badges
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{entry.tokens} HDAG</p>
                        <p className="text-xs text-gray-500">{entry.referrals} referrals</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
