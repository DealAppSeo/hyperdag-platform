import { useEffect } from "react";
import { useLocation } from "wouter";

export default function DocumentationRedirect() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the documentation page
    setLocation("/documentation");
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
    </div>
  );
}