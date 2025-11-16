import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Local type definitions to avoid shared schema dependency
interface User {
  id: number;
  username: string;
  email: string;
  isAdmin?: boolean;
  onboardingStage?: number;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface VerifyCodeData {
  username: string;
  code: string;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<{message: string, username: string, needsVerification: boolean}, Error, LoginData>;
  registerMutation: UseMutationResult<{message: string, username: string, needsVerification: boolean}, Error, RegisterData>;
  verifyMutation: UseMutationResult<User, Error, VerifyCodeData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  pendingUsername: string | null;
  setPendingUsername: (username: string | null) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error("Failed to fetch user");
        }
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(credentials)
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.needsVerification) {
        setPendingUsername(data.username);
        toast({
          title: "Verification required",
          description: "Please check your email for verification code",
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        setTimeout(() => {
          if (user?.isAdmin) {
            setLocation("/admin");
          } else {
            setLocation("/dashboard");
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
    mutationFn: async (data: VerifyCodeData) => {
      const res = await apiRequest("/api/verify", {
        method: "POST",
        body: JSON.stringify(data)
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setPendingUsername(null);
      toast({
        title: "Verification successful",
        description: "Your account has been verified!",
      });
      setLocation("/welcome");
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
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.clear();
      setPendingUsername(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    error: error as Error | null,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    verifyMutation,
    logoutMutation,
    pendingUsername,
    setPendingUsername,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}