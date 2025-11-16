import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/layout";
import UserAvatar from "@/components/ui/user-avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Trophy, Medal, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tokens");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    enabled: !!user,
  });
  
  if (!user) return null;
  
  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboard?.filter(entry => 
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort leaderboard based on active tab
  const sortedLeaderboard = filteredLeaderboard ? [...filteredLeaderboard].sort((a, b) => {
    if (activeTab === "tokens") return b.tokens - a.tokens;
    if (activeTab === "referrals") return b.referrals - a.referrals;
    if (activeTab === "badges") return b.badges - a.badges;
    return 0;
  }) : [];
  
  // Find current user's rank
  const currentUserRank = sortedLeaderboard.findIndex(entry => entry.id === user.id) + 1;
  
  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>
        
        {/* User Rank Card */}
        <Card className="mb-6 bg-white border border-gray-200 shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <Trophy className="h-10 w-10 mr-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Current Rank</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 inline-block animate-spin" />
                    ) : (
                      `#${currentUserRank || 'N/A'}`
                    )}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 md:gap-8">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Tokens</p>
                  <p className="text-xl font-bold text-primary">{user.tokens || 0}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Referrals</p>
                  <p className="text-xl font-bold text-secondary">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 inline-block animate-spin" />
                    ) : (
                      leaderboard?.find(e => e.id === user.id)?.referrals || 0
                    )}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Badges</p>
                  <p className="text-xl font-bold text-accent">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 inline-block animate-spin" />
                    ) : (
                      leaderboard?.find(e => e.id === user.id)?.badges || 0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Leaderboard Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <CardTitle>Top Contributors</CardTitle>
                <CardDescription>
                  See who's leading the HyperDAG community
                </CardDescription>
              </div>
              
              <div className="mt-4 md:mt-0 relative max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="tokens" className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Tokens</span>
                </TabsTrigger>
                <TabsTrigger value="referrals" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Referrals</span>
                </TabsTrigger>
                <TabsTrigger value="badges" className="flex items-center">
                  <Medal className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Badges</span>
                </TabsTrigger>
              </TabsList>
              
              <LeaderboardTable
                data={sortedLeaderboard}
                isLoading={isLoading}
                valueKey={activeTab as "tokens" | "referrals" | "badges"}
                currentUserId={user.id}
              />
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

interface LeaderboardTableProps {
  data: Array<{
    id: number;
    username: string;
    tokens: number;
    referrals: number;
    badges: number;
  }>;
  isLoading: boolean;
  valueKey: "tokens" | "referrals" | "badges";
  currentUserId: number;
}

function LeaderboardTable({ data, isLoading, valueKey, currentUserId }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No data found</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          There are no users to display or your search returned no results
        </p>
      </div>
    );
  }
  
  // Get appropriate value label based on the active tab
  const getValueLabel = () => {
    switch (valueKey) {
      case "tokens": return "HDAG";
      case "referrals": return "Refs";
      case "badges": return "Badges";
      default: return "";
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left font-medium text-gray-500 px-4 py-3">Rank</th>
            <th className="text-left font-medium text-gray-500 px-4 py-3">User</th>
            <th className="text-right font-medium text-gray-500 px-4 py-3">{getValueLabel()}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => {
            const isCurrentUser = entry.id === currentUserId;
            
            return (
              <tr 
                key={entry.id} 
                className={`${
                  isCurrentUser ? 'bg-primary bg-opacity-5' : index % 2 === 0 ? 'bg-gray-50' : ''
                } ${
                  index < 3 ? 'font-medium' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    {index === 0 && (
                      <Trophy className="h-5 w-5 text-yellow-500 mr-1.5" />
                    )}
                    {index === 1 && (
                      <Trophy className="h-5 w-5 text-gray-400 mr-1.5" />
                    )}
                    {index === 2 && (
                      <Trophy className="h-5 w-5 text-amber-600 mr-1.5" />
                    )}
                    <span className={isCurrentUser ? "font-bold text-primary" : ""}>
                      #{index + 1}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <UserAvatar username={entry.username} size="sm" />
                    <span className={`ml-3 ${isCurrentUser ? "font-bold text-primary" : ""}`}>
                      {entry.username}
                      {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className={`font-mono ${isCurrentUser ? "font-bold text-primary" : ""}`}>
                    {entry[valueKey]}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
