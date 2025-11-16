import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TelegramLoginProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  isLinking?: boolean; // true when linking to existing account, false for new login
  className?: string;
}

interface TelegramConfig {
  available: boolean;
  botUsername?: string;
  redirectUrl: string;
}

export function TelegramLogin({ onSuccess, onError, isLinking = false, className = '' }: TelegramLoginProps) {
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    loadTelegramConfig();
  }, []);

  const loadTelegramConfig = async () => {
    try {
      const response = await fetch("/api/auth/telegram/config");
      const result = await response.json();
      if (result.success) {
        setConfig(result.data);
      } else {
        setError("Telegram authentication not available");
      }
    } catch (error) {
      setError("Failed to load Telegram configuration");
    }
  };

  const handleTelegramAuth = async (telegramData: any) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLinking ? "/api/auth/telegram/link" : "/api/auth/telegram/login";
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(telegramData)
      });
      const result = await response.json();

      if (result.success) {
        onSuccess?.(result.user || result);
      } else {
        const errorMessage = result.error || "Authentication failed";
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = "Network error during authentication";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeVerification = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/telegram/verify-code", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: verificationCode.trim()
        })
      });
      const result = await response.json();

      if (result.success) {
        const userData = result.user || result;
        
        // Check if this is a new user who might want to link to existing account
        if (userData.isNewUser && userData.suggestLinking && !isLinking) {
          // Show account linking option
          const shouldLink = window.confirm(
            "It looks like you might have an existing HyperDAG account. Would you like to link your Telegram authentication to your existing profile instead of creating a new account?"
          );
          
          if (shouldLink) {
            // Redirect to account linking page
            window.location.href = "/link-account";
            return;
          }
        }
        
        onSuccess?.(userData);
      } else {
        const errorMessage = result.error || "Code verification failed";
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = "Network error during verification";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const initializeTelegramWidget = () => {
    if (!config?.available || !config.botUsername) return;

    // Add Telegram Login Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', config.botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', window.location.origin + '/telegram-auth-callback');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    // Handle auth callback
    (window as any).onTelegramAuth = (user: any) => {
      handleTelegramAuth(user);
    };

    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Loading Telegram login...</span>
      </div>
    );
  }

  if (!config.available) {
    return (
      <Alert>
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>
          Telegram login is not currently available. Please use username/password authentication.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <CardTitle>{isLinking ? "Link Telegram Account" : "Login with Telegram"}</CardTitle>
        </div>
        <CardDescription>
          {isLinking 
            ? "Connect your Telegram account to receive notifications and enable privacy features"
            : "Use your Telegram account to sign into HyperDAG securely"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure authentication via Telegram's OAuth system</span>
          </div>

          <div id="telegram-login-container" className="flex justify-center">
            <Button 
              onClick={initializeTelegramWidget}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isLinking ? "Link Telegram Account" : "Login with Telegram"}
                </>
              )}
            </Button>
          </div>

          {showCodeInput && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter code from @HyperDagBot"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCodeVerification()}
                />
              </div>
              <Button 
                onClick={handleCodeVerification}
                disabled={loading || !verificationCode.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            {isLinking 
              ? "This will connect your Telegram account for notifications and privacy features"
              : "New to HyperDAG? An account will be created automatically"
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified Telegram Login Button for use in other components
export function TelegramLoginButton({ 
  onSuccess, 
  onError, 
  isLinking = false,
  variant = "default",
  size = "default",
  className = ""
}: TelegramLoginProps & { 
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleClick = async () => {
    setLoading(true);
    
    try {
      // Check if Telegram is available
      const response = await fetch("/api/auth/telegram/config");
      const result = await response.json();
      
      if (!result.success || !result.data.available) {
        onError?.("Telegram authentication not available");
        setLoading(false);
        return;
      }

      // Use direct Telegram link approach
      const botUsername = result.data.botUsername;
      const telegramUrl = `https://t.me/${botUsername}`;
      
      // Open Telegram app/web
      window.open(telegramUrl, '_blank');
      
      // Reset loading state and show code input
      setTimeout(() => {
        setLoading(false);
        setShowCodeInput(true);
        onError?.("✅ Telegram chat opened! Follow these steps:\n1. Send /start to begin\n2. Send /getcode to receive your verification code\n3. Enter the 6-digit code below");
      }, 500);

    } catch (error) {
      onError?.("Failed to initialize Telegram login");
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      onError?.("Please enter the verification code");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/telegram/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess?.(result.user);
        // Force page reload to update authentication state
        window.location.href = '/';
      } else {
        onError?.(result.error || 'Verification failed');
      }
    } catch (error) {
      onError?.('Network error during verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleClick}
        disabled={loading || showCodeInput}
        variant={variant}
        size="sm"
        className={`${variant === "default" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""} text-xs px-3 py-2 h-10 min-h-[2.5rem] w-full ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
            Connecting...
          </>
        ) : (
          <>
            <MessageSquare className="h-3 w-3 mr-1.5" />
            {isLinking ? "Link Telegram" : "Telegram"}
          </>
        )}
      </Button>

      {showCodeInput && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="telegram-code" className="text-sm font-medium">
              Enter verification code from @HyperDagBot:
            </label>
            <input
              id="telegram-code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-wider"
              maxLength={6}
              autoComplete="off"
            />
          </div>
          <Button 
            onClick={handleVerifyCode}
            disabled={loading || !verificationCode.trim()}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}