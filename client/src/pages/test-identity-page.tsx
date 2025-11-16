import React from 'react';
import { ZkIdentityDashboard } from '@/components/identity/ZkIdentityDashboard';
import { Shield } from 'lucide-react';
import { Layout } from '@/components/layout/layout';

export default function TestIdentityPage() {
  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Shield className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">ZKP Identity Testing</h1>
        </div>
        <div className="max-w-4xl mx-auto">
          <ZkIdentityDashboard />
        </div>
      </div>
    </Layout>
  );
}
