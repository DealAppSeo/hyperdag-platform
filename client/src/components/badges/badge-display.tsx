import React from 'react';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SiTelegram, SiInstagram } from 'react-icons/si';
import { RiBroadcastFill, RiVerifiedBadgeFill, RiMedalFill } from 'react-icons/ri';

interface BadgeDisplayProps {
  badges: string[];
  size?: 'sm' | 'md' | 'lg';
}

const getBadgeInfo = (type: string) => {
  switch(type) {
    case 'telegram_verified':
      return {
        icon: <SiTelegram className="mr-1" />,
        label: 'Telegram Verified',
        description: 'Verified Telegram account',
        color: 'bg-blue-500 hover:bg-blue-600 text-white'
      };
    case 'telegram_influencer':
      return {
        icon: <SiTelegram className="mr-1" />,
        label: 'Telegram Influencer',
        description: 'Telegram account with 5000+ followers',
        color: 'bg-blue-700 hover:bg-blue-800 text-white'
      };
    case 'instagram_verified':
      return {
        icon: <SiInstagram className="mr-1" />,
        label: 'Instagram Verified',
        description: 'Verified Instagram account',
        color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
      };
    case 'instagram_boss':
      return {
        icon: <SiInstagram className="mr-1" />,
        label: 'Instagram Boss',
        description: 'Instagram account with 10000+ followers',
        color: 'bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-800 hover:to-pink-800 text-white'
      };
    case 'project_creator':
      return {
        icon: <RiBroadcastFill className="mr-1" />,
        label: 'Project Creator',
        description: 'Created one or more projects',
        color: 'bg-green-500 hover:bg-green-600 text-white'
      };
    case 'early_adopter':
      return {
        icon: <RiMedalFill className="mr-1" />,
        label: 'Early Adopter',
        description: 'Joined during beta phase',
        color: 'bg-amber-500 hover:bg-amber-600 text-white'
      };
    case 'team_member':
      return {
        icon: <RiVerifiedBadgeFill className="mr-1" />,
        label: 'Team Member',
        description: 'Member of the HyperDAG team',
        color: 'bg-red-500 hover:bg-red-600 text-white'
      };
    default:
      return {
        icon: <RiMedalFill className="mr-1" />,
        label: type,
        description: 'Achievement unlocked',
        color: 'bg-gray-600 hover:bg-gray-700 text-white'
      };
  }
};

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges, size = 'md' }) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-2.5',
    lg: 'text-base py-1.5 px-3.5'
  };

  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {badges.map((badge, index) => {
          const badgeInfo = getBadgeInfo(badge);
          return (
            <Tooltip key={index}>
              <TooltipTrigger>
                <BadgeUI className={`flex items-center ${badgeInfo.color} ${sizeClasses[size]}`}>
                  {badgeInfo.icon}
                  {badgeInfo.label}
                </BadgeUI>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badgeInfo.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
};

export default BadgeDisplay;