import { useState, useRef, useEffect } from "react";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Component that uses the auth context
function VerificationFormContent() {
  const [code, setCode] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyMutation, pendingUsername } = useAuth();

  useEffect(() => {
    // Focus the first input field when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to move to previous input
    if (e.key === "Backspace" && !code[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join("");
    if (fullCode.length === 4 && pendingUsername) {
      verifyMutation.mutate({ code: fullCode, username: pendingUsername });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify Your Account</h2>
        <p className="text-gray-600 mb-4">
          <strong>DEVELOPMENT MODE:</strong> The 4-digit verification code is logged to the server console. Ask the developer to check the console logs for your code.
        </p>
        <div className="flex justify-center space-x-2 my-6">
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={code[index]}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              ref={(el) => (inputRefs.current[index] = el)}
              className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              disabled={verifyMutation.isPending}
            />
          ))}
        </div>
        <p className="text-gray-500 text-sm text-center mt-4">
          Didn't receive a code? <a href="#resend" className="text-primary hover:underline">Resend</a>
        </p>
      </div>
      
      <Button
        onClick={handleVerify}
        disabled={code.join("").length !== 4 || verifyMutation.isPending || !pendingUsername}
        className="w-full"
      >
        {verifyMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify"
        )}
      </Button>
    </div>
  );
}

// Export the wrapper component
export default function VerificationForm() {
  // Make sure the component has access to auth context
  return (
    <VerificationFormContent />
  );
}
