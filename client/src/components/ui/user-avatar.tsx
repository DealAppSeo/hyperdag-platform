interface UserAvatarProps {
  username: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UserAvatar({ username, size = "md", className = "" }: UserAvatarProps) {
  const initial = username.substring(0, 1).toUpperCase();
  
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  };
  
  return (
    <div className={`bg-primary rounded-full ${sizeClasses[size]} flex items-center justify-center text-white font-bold ${className}`}>
      <span>{initial}</span>
    </div>
  );
}
