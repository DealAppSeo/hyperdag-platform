import { SiweMessage } from 'siwe';
import { apiRequest } from '@/lib/queryClient';
import type { Address } from 'viem';

// Web3Auth Service that handles Sign-In with Ethereum (SIWE)
class Web3AuthService {
  private nonce: string | null = null;
  
  // Generate a new nonce from the server
  private async generateNonce(): Promise<string> {
    try {
      const response = await apiRequest('GET', '/api/auth/nonce');
      
      if (!response.ok) {
        throw new Error('Failed to fetch nonce from server');
      }
      
      const data = await response.json();
      this.nonce = data.nonce;
      return this.nonce;
    } catch (error) {
      console.error('Error generating nonce:', error);
      throw error;
    }
  }
  
  // Create a SIWE message
  public async createSiweMessage(
    address: Address,
    statement: string = 'Sign in with Ethereum to HyperDAG'
  ): Promise<SiweMessage> {
    // Get a fresh nonce
    const nonce = await this.generateNonce();
    
    // Create the SIWE message
    const siweMessage = new SiweMessage({
      domain: window.location.host,
      address,
      statement,
      uri: window.location.origin,
      version: '1',
      chainId: 1, // Default to Ethereum mainnet
      nonce,
    });
    
    return siweMessage;
  }
  
  // Verify a SIWE signature with the server
  public async verifySiweSignature(
    message: string,
    signature: string
  ): Promise<{ success: boolean; user?: any }> {
    try {
      const response = await apiRequest('POST', '/api/auth/verify-siwe', {
        message,
        signature,
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify signature');
      }
      
      const data = await response.json();
      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error('Error verifying SIWE signature:', error);
      return { success: false };
    }
  }
  
  // Link an Ethereum address to an existing user account
  public async linkWalletToAccount(
    address: Address,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      const response = await apiRequest('POST', '/api/auth/link-wallet', {
        address,
        signature,
        message,
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error linking wallet to account:', error);
      return false;
    }
  }
  
  // Get user profile by Ethereum address
  public async getUserByAddress(address: Address): Promise<any | null> {
    try {
      const response = await apiRequest('GET', `/api/users/address/${address}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // User not found
        }
        throw new Error('Failed to fetch user by address');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user by address:', error);
      return null;
    }
  }
}

// Export singleton instance
export const web3AuthService = new Web3AuthService();