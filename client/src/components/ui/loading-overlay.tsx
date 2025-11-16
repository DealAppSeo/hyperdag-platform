import { Loader2 } from "lucide-react";
import { createContext, useContext, useState, ReactNode } from "react";

// Create loading context
interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  showLoadingOverlay: (message?: string) => void;
  hideLoadingOverlay: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Loading provider
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const showLoadingOverlay = (newMessage?: string) => {
    setMessage(newMessage);
    setIsLoading(true);
  };

  const hideLoadingOverlay = () => {
    setIsLoading(false);
    setMessage(undefined);
  };

  return (
    <LoadingContext.Provider
      value={{ isLoading, setLoading, showLoadingOverlay, hideLoadingOverlay }}
    >
      {children}
      {isLoading && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
          aria-label="Loading"
          role="status"
        >
          <div className="bg-background p-6 rounded-lg shadow-lg border flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            {message && <p className="mt-4 text-center">{message}</p>}
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

// Hook to use loading context
export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}