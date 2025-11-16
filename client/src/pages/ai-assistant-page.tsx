import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import AiAssistant from "@/components/ai/AiAssistant";

export default function AiAssistantPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to auth page if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ask questions and get AI-powered answers about HyperDAG
          </p>
        </div>
        
        <div className="container mx-auto py-4 px-4">
          <div className="mb-6">
            <p className="text-lg text-gray-700 mb-4">
              Our AI Assistant can answer questions about HyperDAG, its features, and how to use the platform. 
              It's powered by advanced AI technology to provide accurate and helpful information.
            </p>
          </div>

          <AiAssistant />
        </div>
      </div>
    </div>
  );
}
