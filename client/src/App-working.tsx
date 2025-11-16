import React, { Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth, AuthProvider } from "@/hooks/use-auth";

// Import components
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { Layout } from "@/components/layout/layout";

// Import critical pages directly
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import JoinPage from "@/pages/join-page";

// Loading screen component
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading HyperDAG...</p>
      </div>
    </div>
  );
}

// Placeholder component for missing pages
function PlaceholderPage({ pageName }: { pageName: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">HyperDAG Platform</h1>
        <p className="text-muted-foreground">{pageName} - Coming Soon</p>
      </div>
    </div>
  );
}

// Main App Component
const App = React.memo(() => {
  const { user, isLoading: authLoading } = useAuth();

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <WelcomeModal />
      <Layout>
        <Switch>
          {/* Authentication routes */}
          <Route path="/auth" component={AuthPage} />
          <Route path="/join" component={JoinPage} />
          
          {/* Protected routes */}
          {user ? (
            <>
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/about" component={() => <PlaceholderPage pageName="About" />} />
              <Route path="/projects" component={() => <PlaceholderPage pageName="Projects" />} />
              <Route path="/" component={DashboardPage} />
            </>
          ) : (
            <>
              <Route path="/" component={AuthPage} />
              <Route><Redirect to="/auth" /></Route>
            </>
          )}
        </Switch>
      </Layout>
    </Suspense>
  );
});

App.displayName = "App";

// Wrap with AuthProvider
function AppWithProviders() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithProviders;