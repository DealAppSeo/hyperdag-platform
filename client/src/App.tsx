import React, { Suspense, lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Switch } from "wouter";
// MetaMaskProvider removed - using gasless server-side wallet management

// HyperDAG Landing Page (no lazy loading - it's the homepage!)
import HyperDAGLanding from "@/pages/HyperDAGLanding";

// Core Chat Experience
const ValueFocusedChat = lazy(() => import("@/pages/ValueFocusedChat"));
const SharedChat = lazy(() => import("@/pages/SharedChat"));
const ShareLanding = lazy(() => import("@/pages/ShareLanding").then(m => ({ default: m.ShareLanding })));

// Legacy Pages (only for direct access)
const StatusDashboard = lazy(() => import("@/pages/StatusDashboard"));
const APIDocumentation = lazy(() => import("@/pages/APIDocumentation"));

// Web3 Training Academy
const Web3TrainingAcademy = lazy(() => import("@/components/web3-training-academy").then(m => ({ default: m.Web3TrainingAcademy })));

// 4FA Wallet Authentication
const WalletConnect4FA = lazy(() => import("@/components/WalletConnect4FA").then(m => ({ default: m.WalletConnect4FA })));

// Developer Hub
const DevHub = lazy(() => import("@/pages/DevHub"));

// AI Concierge - Cost-optimized AI API
const AIConcierge = lazy(() => import("@/pages/AIConcierge"));

// Trinity Roadmap - Dynamic task prioritization dashboard
const TrinityRoadmap = lazy(() => import("@/pages/TrinityRoadmap"));
const TrinityTaskBoard = lazy(() => import("@/pages/TrinityTaskBoard"));
const TrinityPrompt = lazy(() => import("@/pages/TrinityPrompt"));
const HyperDAG = lazy(() => import("@/pages/HyperDAG"));

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const isModuleError = error.message?.includes('module') || error.message?.includes('import');
  
  if (isModuleError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 mb-4">Module loading issue detected</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-6">
      <div className="bg-white/10 border border-red-500/50 rounded-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🤖💥</div>
        <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
        <p className="text-white/70 mb-6">
          Don't worry, our AI is usually more reliable than this!
        </p>
        <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-6">
          <p className="text-sm text-red-300">{error.message || "Unexpected error occurred"}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="bg-white/10 border border-white/20 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 text-white">🤖</div>
            </div>
            <span className="text-white font-semibold">AI Chat</span>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin w-5 h-5 border border-purple-400 border-t-transparent rounded-full"></div>
            <span className="text-white/80">Loading your AI assistant...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <TooltipProvider>
        <div className="min-h-screen">
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Switch>
                <Route path="/" component={HyperDAGLanding} />
                <Route path="/chat" component={ValueFocusedChat} />
                <Route path="/chat/:id" component={SharedChat} />
                <Route path="/share/:linkId" component={ShareLanding} />
                <Route path="/docs" component={APIDocumentation} />
                <Route path="/status" component={StatusDashboard} />
                <Route path="/training" component={Web3TrainingAcademy} />
                <Route path="/auth/4fa" component={WalletConnect4FA} />
                <Route path="/dev-hub" component={DevHub} />
                <Route path="/ai-concierge" component={AIConcierge} />
                <Route path="/trinity-roadmap" component={TrinityRoadmap} />
                <Route path="/trinity-tasks" component={TrinityTaskBoard} />
                <Route path="/trinity-prompt" component={TrinityPrompt} />
                <Route path="/hyperdag" component={HyperDAG} />
                <Route>
                  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold mb-4">🤖</h1>
                      <p className="text-white/70 mb-6">Page not found</p>
                      <a href="/" className="text-purple-400 hover:underline mt-4 inline-block">
                        Return Home
                      </a>
                    </div>
                  </div>
                </Route>
              </Switch>
            </Suspense>
          </Router>
          <Toaster />
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}