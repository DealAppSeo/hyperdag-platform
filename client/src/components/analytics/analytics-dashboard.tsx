import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Loader2, UserPlus, Eye, MousePointerClick, Users, Activity, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Analytics Dashboard Component
 * Displays analytics data for administrators
 */
export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('week');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/analytics/admin/dashboard'],
    refetchInterval: false // ❌ NO POLLING - eliminated 1 req/min
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <AnalyticsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load analytics data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Extract data from API response
  const { pageViews, events, userStats } = data?.data || { 
    pageViews: {}, 
    events: {}, 
    userStats: {}
  };

  // Dashboard stats
  const totalUsers = userStats.totalUsers || 0;
  const activeUsers = userStats.activeUsers || 0;
  const newUsers = userStats.newUsers || 0;
  const totalPageViews = pageViews.totalViews || 0;
  const averageSessionDuration = userStats.averageSessionDuration || 0;
  const completionRate = userStats.onboardingCompletionRate || 0;
  const retentionRate = userStats.retentionRate || 0;
  const referralRate = userStats.referralRate || 0;

  // Format for charts
  const pageViewsData = pageViews.byDay || [];
  const eventTypesData = events.byType || [];
  const userVisitsByPath = pageViews.byPath || [];
  const retentionData = userStats.retentionByWeek || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF6B6B'];

  return (
    <div className="space-y-8">
      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnalyticsCard 
          title="Total Users" 
          value={totalUsers} 
          icon={<Users className="h-4 w-4" />} 
        />
        <AnalyticsCard 
          title="Active Users" 
          value={activeUsers} 
          icon={<Activity className="h-4 w-4" />} 
        />
        <AnalyticsCard 
          title="New Users" 
          value={newUsers} 
          icon={<UserPlus className="h-4 w-4" />} 
        />
        <AnalyticsCard 
          title="Total Page Views" 
          value={totalPageViews} 
          icon={<Eye className="h-4 w-4" />} 
        />
        <AnalyticsCard 
          title="Avg Session Duration" 
          value={`${Math.round(averageSessionDuration / 60)}m ${Math.round(averageSessionDuration % 60)}s`} 
          icon={<MousePointerClick className="h-4 w-4" />}
          isText={true}
        />
        <AnalyticsCard 
          title="Onboarding Completion" 
          value={`${Math.round(completionRate * 100)}%`} 
          icon={<Star className="h-4 w-4" />}
          isText={true}
        />
        <AnalyticsCard 
          title="Retention Rate" 
          value={`${Math.round(retentionRate * 100)}%`} 
          icon={<Users className="h-4 w-4" />}
          isText={true}
        />
        <AnalyticsCard 
          title="Referral Rate" 
          value={`${Math.round(referralRate * 100)}%`} 
          icon={<UserPlus className="h-4 w-4" />}
          isText={true}
        />
      </div>

      {/* Tabs for different chart views */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="pageviews">Page Views</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
        </TabsList>

        {/* User Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Users Over Time</CardTitle>
                <CardDescription>Daily active user count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={userStats.activeUsersByDay || []}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={userStats.newUsersByDay || []}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Page Views Tab */}
        <TabsContent value="pageviews" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Page Views Over Time</CardTitle>
                <CardDescription>Daily page view count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={pageViewsData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Visited Pages</CardTitle>
                <CardDescription>Page visits by route</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userVisitsByPath.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="path" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Distribution</CardTitle>
                <CardDescription>Events by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={eventTypesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {eventTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Trends</CardTitle>
                <CardDescription>Events over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={events.byDay || []}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#FF8042" fill="#FF8042" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Retention</CardTitle>
                <CardDescription>Weekly retention rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={retentionData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                      <Bar dataKey="rate" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Onboarding Completion</CardTitle>
                <CardDescription>Progress through onboarding steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userStats.onboardingStepCompletion || []}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="step" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                      <Bar dataKey="completionRate" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalyticsCard({ title, value, icon, isText = false }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isText ? '' : 'tracking-tighter'}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-5 w-24 animate-pulse rounded bg-muted"></div>
        <div className="h-4 w-4 animate-pulse rounded-full bg-muted"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 animate-pulse rounded bg-muted"></div>
      </CardContent>
    </Card>
  );
}