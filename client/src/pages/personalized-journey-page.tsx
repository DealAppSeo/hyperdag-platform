import LeadFunnelController from "@/components/onboarding/lead-funnel-controller";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/layout";

export default function PersonalizedJourneyPage() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container px-4 py-6 mx-auto max-w-7xl">
        <PageHeader
          title="Personalized Journey"
          description="Customize your HyperDAG experience based on your interests and knowledge level"
        />
        
        <div className="mt-8">
          <LeadFunnelController />
        </div>
      </div>
    </Layout>
  );
}