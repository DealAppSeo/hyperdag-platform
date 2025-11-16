import { StellarDashboard } from "@/components/stellar/StellarDashboard";
import { Card } from "@/components/ui/card";

export default function StellarPage() {
  return (
    <div className="container py-6 space-y-6 max-w-7xl mx-auto">
      <StellarDashboard />
    </div>
  );
}