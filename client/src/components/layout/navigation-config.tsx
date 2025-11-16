// Define the navigation structure - can be imported by both desktop and mobile nav

export const coreNavigationItems = [
  {
    title: "Dashboard",
    items: [
      { id: "dashboard", href: "/", icon: "home", text: "Dashboard" },
      { id: "ai-enhancement", href: "/ai-enhancement", icon: "brain", text: "AI Enhancement" },
    ]
  },
  {
    title: "Identity & Reputation",
    items: [
      { id: "identity", href: "/identity", icon: "fingerprint", text: "Digital Identity" },
      { id: "superpower", href: "/superpower", icon: "zap", text: "SuperPower Discovery" },
      { id: "credentials", href: "/credentials", icon: "badge-check", text: "Credentials" },
      { id: "reputation", href: "/reputation", icon: "shield", text: "Reputation Score" },
      { id: "zkp", href: "/zkp-dashboard", icon: "lock", text: "Zero-Knowledge Proofs" },
    ]
  },
  {
    title: "Projects & Funding",
    items: [
      { id: "projectsList", href: "/projects", icon: "clipboard", text: "My Projects" },
      { id: "grantFlow", href: "/grant-flow", icon: "dollar-sign", text: "Funding" },
      { id: "proposals", href: "/proposals", icon: "file-text", text: "My Proposals" },
    ]
  },
  {
    title: "Community",
    items: [
      { id: "hypercrowd", href: "/hypercrowd", icon: "users", text: "HyperCrowd" },
      { id: "socialConnections", href: "/social-connections", icon: "link", text: "Social Connections" },
      { id: "teamMatching", href: "/team-matching", icon: "users-cog", text: "Team Matching" },
      { id: "goals", href: "/networking-goals", icon: "target", text: "Networking Goals" },
    ]
  },
  {
    title: "Rewards & Learning",
    items: [
      { id: "rewards", href: "/rewards", icon: "coins", text: "Rewards" },
      { id: "leaderboard", href: "/leaderboard", icon: "bar-chart", text: "Leaderboard" },
      { id: "refer", href: "/refer", icon: "share", text: "Refer Friends" },
      { id: "learning", href: "/learning", icon: "book-open", text: "Learning Center" },
      { id: "journey", href: "/sticky-features", icon: "sparkles", text: "My Journey" },
    ]
  },
  {
    title: "Developer Resources",
    items: [
      { id: "developer", href: "/developer", icon: "code", text: "Developer Hub" },
      { id: "documentation", href: "/documentation", icon: "file-text", text: "Documentation" },
      { 
        id: "advancedTools", 
        icon: "tool", 
        text: "Advanced Tools", 
        protected: true,
        subitems: [
          { id: "aiAssistant", href: "/ai-assistant", text: "AI Assistant" },
          { id: "bacalhau", href: "/bacalhau", text: "Remote Compute" },
          { id: "web3Tech", href: "/web3", text: "Web3 Technology", icon: "layers" },
          { id: "testing", href: "/test-identity", text: "Testing Tools" },
        ]
      },
    ]
  },
  {
    title: "Settings",
    items: [
      { id: "settings", href: "/settings", icon: "settings", text: "Account Settings" },
      { id: "security", href: "/security-practices", icon: "shield-lock", text: "Security Practices" },
      { id: "profile", href: "/profile", icon: "user-profile", text: "My Profile" },
    ]
  }
];

// Mobile navigation items for the bottom navigation bar
export const mobileBottomNavItems = [
  { id: "home", href: "/", icon: "home", text: "Home" },
  { id: "marketplace", href: "/market-maker", icon: "share", text: "Market Maker" },
  { id: "projects", href: "/projects", icon: "clipboard", text: "Projects" },
  { id: "rewards", href: "/rewards", icon: "coins", text: "Rewards" },
  { id: "account", href: "/my-dashboard", icon: "user", text: "Account" },
];

// Helper function to get persona color (for future theming)
export function getPersonaColor(persona?: string) {
  switch (persona?.toLowerCase()) {
    case 'developer':
    case 'blue':
      return 'blue-500';
    case 'designer':
    case 'orange':
      return 'orange-500';
    case 'influencer':
    case 'green':
      return 'green-500';
    default:
      return 'primary';
  }
}
