interface BadgeDisplayProps {
  badges: string[];
  size?: "sm" | "md" | "lg";
}

export default function BadgeDisplay({ badges, size = "md" }: BadgeDisplayProps) {
  const sizeClasses = {
    sm: {
      container: "p-1",
      icon: "w-8 h-8 mb-1",
      text: "text-xs"
    },
    md: {
      container: "p-2",
      icon: "w-12 h-12 mb-2",
      text: "text-sm"
    },
    lg: {
      container: "p-3",
      icon: "w-16 h-16 mb-3",
      text: "text-base"
    }
  };

  const badgeInfo = {
    creator: {
      name: "Creator",
      bgColor: "bg-primary bg-opacity-10",
      iconBg: "bg-primary",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      )
    },
    networker: {
      name: "Networker",
      bgColor: "bg-secondary bg-opacity-10",
      iconBg: "bg-secondary",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    backer: {
      name: "Backer",
      bgColor: "bg-accent bg-opacity-10",
      iconBg: "bg-accent",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    innovator: {
      name: "Innovator",
      bgColor: "bg-green-100",
      iconBg: "bg-green-500",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {badges.map((badge) => {
        const info = badgeInfo[badge.toLowerCase() as keyof typeof badgeInfo];
        if (!info) return null;
        
        return (
          <div 
            key={badge}
            className={`flex flex-col items-center ${sizeClasses[size].container} rounded-lg ${info.bgColor}`}
          >
            <div className={`${sizeClasses[size].icon} rounded-full ${info.iconBg} text-white flex items-center justify-center`}>
              {info.icon}
            </div>
            <p className={`text-center ${sizeClasses[size].text} font-medium`}>{info.name}</p>
          </div>
        );
      })}
    </div>
  );
}
