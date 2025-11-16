import React, { Suspense, memo, lazy } from "react";
import { Switch, Route, Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth, AuthProvider } from "@/hooks/use-auth";

// Import components
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { Layout } from "@/components/layout/layout";

// Import critical pages directly for faster initial load
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import JoinPage from "@/pages/join-page";

// Core sophisticated platform pages - working components from two days ago
const PurposeHubPage = lazy(() => import("@/pages/purpose-hub"));
const GrantFlowOverviewPage = lazy(() => import("@/pages/grantflow"));
const AboutPage = lazy(() => import("@/pages/about-page"));
const ProjectsPage = lazy(() => import("@/pages/projects-page"));
const HyperCrowdPage = lazy(() => import("@/pages/hypercrowd"));
const CreateProjectPage = lazy(() => import("@/pages/create-project-page"));
const DeveloperDashboard = lazy(() => import("@/pages/developer-dashboard"));

// Persona-based discovery and onboarding system
const OnboardingPage = lazy(() => import("@/pages/onboarding-page"));
const ProfileCreationPage = lazy(() => import("@/pages/profile-creation"));

// AI and specialized features
const AIEnhancementPage = lazy(() => import("@/pages/ai-enhancement-page"));
const ZKPPage = lazy(() => import("@/pages/zkp-page"));
const DefinitionsPage = lazy(() => import("@/pages/definitions-page"));

// Marketing one-pagers - these were working
import AiDaoOnepager from "@/pages/ai-dao-onepager";
import ZkpIdentityOnepager from "@/pages/zkp-identity-onepager";
import GrantflowOnepager from "@/pages/grantflow-onepager";
import HypercrowdOnepager from "@/pages/hypercrowd-onepager";
import FeaturesShowcase from "@/pages/features-showcase";

// Grant discovery and management system
const GrantsPage = lazy(() => import("@/pages/grants-page"));
const GrantRankingPage = lazy(() => import("@/pages/grant-ranking-page"));

// Account and settings
const AccountPage = lazy(() => import("@/pages/account-page"));
const SettingsPage = lazy(() => import("@/pages/settings-page"));

// Developer platform
const DeveloperApiPage = lazy(() => import("@/pages/developer-api"));
const ApiDocumentationPage = lazy(() => import("@/pages/api-documentation-page"));

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

// Safe component wrapper to handle loading failures
function SafeComponent({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  );
}

// Main App Component with sophisticated routing
const AppCore = memo(() => {
  const { user, isLoading: authLoading } = useAuth();

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeComponent>
      <WelcomeModal />
      <Layout>
        <Switch>
          {/* Authentication routes */}
          <Route path="/auth" component={AuthPage} />
          <Route path="/join" component={JoinPage} />
          
          {/* Core platform routes */}
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/projects" component={ProjectsPage} />
          <Route path="/projects/create" component={CreateProjectPage} />
          
          {/* Persona-based discovery system */}
          <Route path="/purpose-hub" component={PurposeHubPage} />
          <Route path="/onboarding" component={OnboardingPage} />
          <Route path="/profile-creation" component={ProfileCreationPage} />
          
          {/* Grant flow system */}
          <Route path="/grantflow" component={GrantFlowOverviewPage} />
          <Route path="/grants" component={GrantsPage} />
          <Route path="/grant-ranking" component={GrantRankingPage} />
          
          {/* HyperCrowd team building */}
          <Route path="/hypercrowd" component={HyperCrowdPage} />
          
          {/* AI and Web3 features */}
          <Route path="/ai-enhancement" component={AIEnhancementPage} />
          <Route path="/zkp" component={ZKPPage} />
          <Route path="/definitions" component={DefinitionsPage} />
          
          {/* Developer platform */}
          <Route path="/developer" component={DeveloperDashboard} />
          <Route path="/developer-api" component={DeveloperApiPage} />
          <Route path="/api-docs" component={ApiDocumentationPage} />
          
          {/* Account management */}
          <Route path="/account" component={AccountPage} />
          <Route path="/settings" component={SettingsPage} />
          
          {/* Marketing one-pagers - public access */}
          <Route path="/ai-dao" component={AiDaoOnepager} />
          <Route path="/id" component={ZkpIdentityOnepager} />
          <Route path="/grantflow-info" component={GrantflowOnepager} />
          <Route path="/hypercrowd-info" component={HypercrowdOnepager} />
          <Route path="/features-app" component={FeaturesShowcase} />
          
          {/* Root route - sophisticated persona discovery */}
          {user ? (
            <Route path="/" component={PurposeHubPage} />
          ) : (
            <Route path="/" component={AuthPage} />
          )}
          
          {/* Fallback redirect */}
          <Route><Redirect to={user ? "/purpose-hub" : "/auth"} /></Route>
        </Switch>
      </Layout>
    </SafeComponent>
  );
});

AppCore.displayName = "AppCore";

// App with providers - sophisticated HyperDAG platform
function App() {
  return (
    <AuthProvider>
      <AppCore />
    </AuthProvider>
  );
}

export default App;