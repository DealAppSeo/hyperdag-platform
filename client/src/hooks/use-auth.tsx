import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { 
  User as SelectUser,
  LoginData,
  RegisterData,
  VerifyCodeData
} from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<{message: string, username: string, needsVerification: boolean}, Error, LoginData>;
  registerMutation: UseMutationResult<{message: string, username: string, needsVerification: boolean}, Error, RegisterData>;
  verifyMutation: UseMutationResult<SelectUser, Error, VerifyCodeData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  pendingUsername: string | null;
  setPendingUsername: (username: string | null) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const [location, setLocation] = useLocation();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      return data;
    },
    onSuccess: async (data) => {
      // Handle admin users differently than regular users
      if (data.needsVerification) {
        // Regular user needs verification
        setPendingUsername(data.username);
        toast({
          title: "Verification required",
          description: "Please check your verification code",
        });
      } else {
        // Admin user or already verified - direct login
        // First update query cache to ensure user state is ready
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        
        // Wait a bit for cache invalidation to complete
        setTimeout(async () => {
          await queryClient.refetchQueries({ queryKey: ["/api/user"] });
          
          toast({
            title: "Login successful",
            description: "Welcome to HyperDAG!",
          });
          
          // Navigate after ensuring user data is loaded
          if (data.isAdmin || data.loginBypassed || data.isFullyOnboarded) {
            setLocation("/dashboard");
          } else {
            setLocation("/");
          }
        }, 100);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify(credentials)
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // New users go to welcome/onboarding
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Registration successful",
        description: "Welcome to HyperDAG!",
      });
      setLocation("/welcome");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (verifyData: VerifyCodeData) => {
      const res = await apiRequest("/api/verify", {
        method: "POST",
        body: JSON.stringify(verifyData)
      });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setPendingUsername(null);
      toast({
        title: "Verification successful",
        description: "Welcome to HyperDAG!",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/logout", { method: "POST" });
    },
    onSuccess: () => {
      // Clear all cached data immediately
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear any local storage
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      
      // Force a hard navigation to auth page
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      // Even if logout fails on server, clear client state
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logout completed",
        description: "Session cleared locally",
      });
      
      // Force navigation even on error
      window.location.href = "/auth";
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        isAuthenticated: !!user,
        loginMutation,
        registerMutation,
        verifyMutation,
        logoutMutation,
        pendingUsername,
        setPendingUsername
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
