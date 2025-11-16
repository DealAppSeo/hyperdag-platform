import { useParams } from 'wouter';
import { BackButton } from '@/components/ui/back-button';
import { RfpDetailsWithBlockchainVerification } from '@/components/grants/RfpDetailsWithBlockchainVerification';

export default function RfpDetailsPage() {
  // Get RFP ID from URL parameters
  const params = useParams();
  const rfpId = params.id ? parseInt(params.id) : null;

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <BackButton href="/grants">Back to Grants</BackButton>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">RFP Details</h1>
      
      {rfpId ? (
        <RfpDetailsWithBlockchainVerification rfpId={rfpId} />
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <p className="text-amber-800">No RFP ID provided. Please select an RFP from the grants page.</p>
        </div>
      )}
    </div>
  );
}