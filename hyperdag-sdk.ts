import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData from 'form-data';

export interface HyperDAGConfig {
  apiKey: string;
  baseURL: string;
  environment?: 'production' | 'sandbox';
  timeout?: number;
}

export interface SBTCredential {
  id: number;
  userId: number;
  type: string;
  title: string;
  description: string;
  evidence: string;
  status: 'pending' | 'verified' | 'rejected';
  issuedAt: Date;
  expiresAt?: Date;
  zkProof?: string;
  ipfsHash?: string;
  isMonetizable: boolean;
  pricePerAccess?: number;
  maxAccesses?: number;
  accessCount: number;
}

export interface ZKProof {
  zkProof: string;
  publicInputs: string[];
  circuit: string;
}

export interface ReputationScore {
  userId: number;
  totalScore: number;
  breakdown: {
    identity: number;
    professional: number;
    social: number;
    financial: number;
  };
  lastUpdated: Date;
}

export interface AuthVerification {
  verified: boolean;
  factors: string[];
  proofOfLife: boolean;
  timestamp: Date;
}

export class HyperDAGSDK {
  private client: AxiosInstance;
  private config: HyperDAGConfig;

  constructor(config: HyperDAGConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-SDK-Version': '2.1.0'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new HyperDAGError('INVALID_API_KEY', 'API key is invalid or expired');
        } else if (error.response?.status === 429) {
          throw new HyperDAGError('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded');
        } else if (error.response?.status === 403) {
          throw new HyperDAGError('INSUFFICIENT_PERMISSIONS', 'Feature not enabled for your API key');
        }
        throw error;
      }
    );
  }

  // SBT Methods
  public get sbt() {
    return {
      register: async (data: {
        type: string;
        title: string;
        description: string;
        evidence?: string;
      }): Promise<SBTCredential> => {
        const response = await this.client.post('/api/sbt/register', data);
        return response.data.data;
      },

      checkAuthRequirements: async (): Promise<{
        hasProfile: boolean;
        has2FA: boolean;
        hasWallet: boolean;
        canCreateSBT: boolean;
        errors: string[];
      }> => {
        const response = await this.client.get('/api/sbt/auth-requirements');
        return response.data.data;
      },

      getCredentials: async (): Promise<SBTCredential[]> => {
        const response = await this.client.get('/api/sbt/credentials');
        return response.data.credentials;
      },

      mint: async (data: {
        type: string;
        title: string;
        description: string;
        file: File | Buffer;
        isMonetizable?: boolean;
        pricePerAccess?: number;
        maxAccesses?: number;
      }): Promise<SBTCredential> => {
        const formData = new FormData();
        formData.append('type', data.type);
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('isMonetizable', String(data.isMonetizable || false));
        
        if (data.pricePerAccess) {
          formData.append('pricePerAccess', String(data.pricePerAccess));
        }
        if (data.maxAccesses) {
          formData.append('maxAccesses', String(data.maxAccesses));
        }

        if (data.file instanceof File) {
          formData.append('file', data.file);
        } else {
          formData.append('file', data.file, { filename: 'credential.bin' });
        }

        const response = await this.client.post('/api/sbt/credentials/mint', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data.credential;
      },

      revoke: async (credentialId: number): Promise<boolean> => {
        const response = await this.client.post(`/api/sbt/credentials/${credentialId}/revoke`);
        return response.data.success;
      },

      getAnalytics: async (credentialId: number): Promise<any> => {
        const response = await this.client.get(`/api/sbt/credentials/${credentialId}/analytics`);
        return response.data.analytics;
      },

      updatePrivacy: async (credentialId: number, settings: any): Promise<SBTCredential> => {
        const response = await this.client.patch(`/api/sbt/credentials/${credentialId}/privacy`, settings);
        return response.data.data;
      }
    };
  }

  // Zero-Knowledge Proof Methods
  public get zkp() {
    return {
      generate: async (data: {
        data: any;
        circuit: string;
        userCommitment?: string;
      }): Promise<ZKProof> => {
        const response = await this.client.post('/api/zkp/generate', data);
        return response.data;
      },

      verify: async (data: {
        proof: string;
        publicInputs: string[];
        circuit?: string;
      }): Promise<boolean> => {
        const response = await this.client.post('/api/zkp/verify', data);
        return response.data.valid;
      },

      getCircuits: async (): Promise<string[]> => {
        const response = await this.client.get('/api/zkp/circuits');
        return response.data.circuits;
      }
    };
  }

  // Reputation System Methods
  public get reputation() {
    return {
      getScore: async (userId?: number): Promise<ReputationScore> => {
        const url = userId ? `/api/reputation/score?userId=${userId}` : '/api/reputation/score';
        const response = await this.client.get(url);
        return response.data.score;
      },

      update: async (data: {
        userId?: number;
        activity: string;
        points: number;
        evidence?: string;
        metadata?: any;
      }): Promise<boolean> => {
        const response = await this.client.post('/api/reputation/update', data);
        return response.data.success;
      },

      getHistory: async (userId?: number): Promise<any[]> => {
        const url = userId ? `/api/reputation/history?userId=${userId}` : '/api/reputation/history';
        const response = await this.client.get(url);
        return response.data.history;
      }
    };
  }

  // Authentication Methods
  public get auth() {
    return {
      setup4FA: async (data: {
        userId?: number;
        factors: string[];
        deviceInfo?: any;
      }): Promise<any> => {
        const response = await this.client.post('/api/auth/4fa/setup', data);
        return response.data;
      },

      verify4FA: async (data: {
        userId?: number;
        factors: { [key: string]: string };
      }): Promise<AuthVerification> => {
        const response = await this.client.post('/api/auth/4fa/verify', data);
        return response.data;
      },

      verifyWithPOL: async (data: {
        userId?: number;
        biometricData?: string;
        deviceFingerprint?: any;
        location?: { lat: number; lng: number };
      }): Promise<AuthVerification> => {
        const response = await this.client.post('/api/auth/pol/verify', data);
        return response.data;
      }
    };
  }

  // Developer Tools
  public get developer() {
    return {
      validateKey: async (): Promise<any> => {
        const response = await this.client.post('/api/developer/sdk/validate-key', {
          apiKey: this.config.apiKey
        });
        return response.data.data;
      },

      getFeatures: async (): Promise<any[]> => {
        const response = await this.client.get('/api/developer/sdk/features');
        return response.data.data;
      },

      getAnalytics: async (): Promise<any> => {
        const response = await this.client.get('/api/developer/sdk/analytics');
        return response.data.data;
      }
    };
  }

  // Webhook Management
  public get webhooks() {
    return {
      subscribe: async (event: string, url: string): Promise<boolean> => {
        const response = await this.client.post('/api/webhooks/subscribe', {
          event,
          url
        });
        return response.data.success;
      },

      unsubscribe: async (event: string, url: string): Promise<boolean> => {
        const response = await this.client.post('/api/webhooks/unsubscribe', {
          event,
          url
        });
        return response.data.success;
      },

      list: async (): Promise<any[]> => {
        const response = await this.client.get('/api/webhooks');
        return response.data.webhooks;
      }
    };
  }

  // Smart Wallet Methods
  public get smartWallet() {
    return {
      create: async (): Promise<{
        address: string;
        smartAccountAddress: string;
        isDeployed: boolean;
      }> => {
        const response = await this.client.post('/api/smart-wallet/create');
        return response.data;
      },

      status: async (): Promise<{
        hasWallet: boolean;
        isDeployed: boolean;
        address?: string;
        smartAccountAddress?: string;
        balance?: string;
        chain: string;
      }> => {
        const response = await this.client.get('/api/smart-wallet/status');
        return response.data;
      },

      deploy: async (): Promise<{
        success: boolean;
        transactionHash?: string;
        error?: string;
      }> => {
        const response = await this.client.post('/api/smart-wallet/deploy');
        return response.data;
      },

      getBalance: async (): Promise<{
        balance: string;
        formatted: string;
      }> => {
        const response = await this.client.get('/api/smart-wallet/balance');
        return response.data;
      },

      executeTransaction: async (calls: Array<{
        target: string;
        data: string;
        value?: string;
      }>): Promise<{
        success: boolean;
        transactionHash?: string;
        gasUsed?: string;
        error?: string;
      }> => {
        const response = await this.client.post('/api/smart-wallet/execute', { calls });
        return response.data;
      },

      estimateGas: async (calls: Array<{
        target: string;
        data: string;
        value?: string;
      }>): Promise<{
        gasEstimate: string;
        gasPrice: string;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
      }> => {
        const response = await this.client.post('/api/smart-wallet/estimate-gas', { calls });
        return response.data;
      },

      getInfo: async (): Promise<{
        address: string;
        smartAccountAddress: string;
        isDeployed: boolean;
        balance: string;
        nonce: number;
        chain: {
          id: number;
          name: string;
          nativeCurrency: any;
        };
      }> => {
        const response = await this.client.get('/api/smart-wallet/info');
        return response.data;
      }
    };
  }

  // Utility Methods
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  public setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }
}

// Error handling
export class HyperDAGError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'HyperDAGError';
  }
}

// React Hook (optional)
export function useHyperDAG(config?: HyperDAGConfig) {
  if (typeof window === 'undefined') {
    throw new Error('useHyperDAG can only be used in browser environments');
  }

  const sdk = new HyperDAGSDK(config || {
    apiKey: process.env.REACT_APP_HYPERDAG_API_KEY || '',
    baseURL: process.env.REACT_APP_HYPERDAG_BASE_URL || 'https://api.hyperdag.org'
  });

  return {
    sbt: sdk.sbt,
    zkp: sdk.zkp,
    reputation: sdk.reputation,
    auth: sdk.auth,
    developer: sdk.developer,
    webhooks: sdk.webhooks,
    smartWallet: sdk.smartWallet,
    healthCheck: sdk.healthCheck.bind(sdk),
    loading: false,
    error: null
  };
}

// Export everything
export default HyperDAGSDK;