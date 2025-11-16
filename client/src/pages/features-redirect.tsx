import { useEffect } from "react";
import { useLocation } from "wouter";

export default function FeaturesRedirect() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the personalized journey page
    setLocation("/personalized-journey");
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
    </div>
  );
}