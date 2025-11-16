import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Define types for our API response
interface QRCodeData {
  qrCodeUrl: string;
  referralCode: string;
}

interface QRCodeResponse {
  success: boolean;
  data: QRCodeData;
}

export default function ReferralQRCode() {
  const { data: apiResponse, isLoading, error } = useQuery<QRCodeResponse>({
    queryKey: ["/api/referral/qr"],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-gray-600">Generating your unique QR code...</p>
      </div>
    );
  }

  if (error || !apiResponse || !apiResponse.success) {
    console.error("QR code error:", error || apiResponse);
    return (
      <div className="flex flex-col items-center p-6">
        <div className="bg-red-100 p-4 rounded-lg text-red-700 text-center">
          <p className="font-semibold">Failed to generate QR code</p>
          <p className="text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  // Extract the actual data from the API response
  const data = apiResponse.data;

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="bg-white p-2 rounded-lg shadow mb-4">
        <img 
          src={data.qrCodeUrl} 
          alt="Referral QR Code" 
          className="w-36 h-36" 
        />
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-2">Share this code to earn rewards</p>
        <p className="font-medium text-primary mb-3">Your code: {data.referralCode}</p>
        <div className="flex justify-center space-x-3">
          <button className="bg-primary text-white p-2 rounded-full hover:bg-opacity-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button className="bg-secondary text-white p-2 rounded-full hover:bg-opacity-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="bg-accent text-white p-2 rounded-full hover:bg-opacity-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
