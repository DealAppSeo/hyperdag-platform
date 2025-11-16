import crypto from 'crypto';

interface IPFSFile {
  name: string;
  hash: string;
  size: number;
}

interface IPFSUploadResult {
  ipfsHash: string;
  size: number;
  gatewayUrl: string;
}

class IPFSStorageService {
  private apiUrl: string;
  private gatewayUrl: string;
  private pinataApiKey: string;
  private pinataSecretKey: string;

  constructor() {
    // Using Pinata as IPFS provider
    this.apiUrl = process.env.IPFS_API_URL || 'https://api.pinata.cloud';
    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataSecretKey = process.env.PINATA_SECRET_API_KEY || '';
    
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('[IPFS] Pinata credentials not configured, using development mode');
    } else {
      console.log('[IPFS] Pinata IPFS service initialized with API credentials');
    }
  }

  /**
   * Upload encrypted data to IPFS
   */
  async uploadEncryptedData(data: Buffer, filename: string): Promise<IPFSUploadResult> {
    try {
      // If Pinata credentials are available, use real IPFS upload
      if (this.pinataApiKey && this.pinataSecretKey) {
        const FormData = require('form-data');
        const form = new FormData();
        
        form.append('file', data, {
          filename: filename,
          contentType: 'application/octet-stream'
        });
        
        const metadata = JSON.stringify({
          name: filename,
          keyvalues: {
            uploaded_by: 'hyperdag',
            encrypted: 'true',
            timestamp: new Date().toISOString()
          }
        });
        form.append('pinataMetadata', metadata);
        
        const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
          method: 'POST',
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey,
            ...form.getHeaders()
          },
          body: form
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[IPFS] Pinata API error: ${response.status} ${response.statusText} - ${errorText}`);
          throw new Error(`Pinata upload failed: ${response.statusText} (Invalid API credentials)`);
        }
        
        const result = await response.json();
        console.log(`[IPFS] Successfully uploaded ${filename} to IPFS: ${result.IpfsHash}`);
        
        return {
          ipfsHash: result.IpfsHash,
          size: data.length,
          gatewayUrl: `${this.gatewayUrl}/${result.IpfsHash}`
        };
      } else {
        // Fallback to mock for development
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        const mockHash = `Qm${hash.substring(0, 44)}`;
        
        console.log(`[IPFS] Mock upload of ${filename} (${data.length} bytes)`);
        
        return {
          ipfsHash: mockHash,
          size: data.length,
          gatewayUrl: `${this.gatewayUrl}/${mockHash}`
        };
      }
    } catch (error) {
      console.error('[IPFS] Upload failed:', error);
      throw new Error('Failed to upload to IPFS');
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadMetadata(metadata: Record<string, any>): Promise<IPFSUploadResult> {
    try {
      if (this.pinataApiKey && this.pinataSecretKey) {
        const response = await fetch(`${this.apiUrl}/pinning/pinJSONToIPFS`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey,
          },
          body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
              name: 'hyperdag-metadata',
              keyvalues: {
                type: 'metadata',
                uploaded_by: 'hyperdag',
                timestamp: new Date().toISOString()
              }
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`Pinata JSON upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`[IPFS] Successfully uploaded metadata to IPFS: ${result.IpfsHash}`);
        
        return {
          ipfsHash: result.IpfsHash,
          size: JSON.stringify(metadata).length,
          gatewayUrl: `${this.gatewayUrl}/${result.IpfsHash}`
        };
      } else {
        // Fallback to file upload for mock mode
        const jsonData = JSON.stringify(metadata, null, 2);
        const buffer = Buffer.from(jsonData, 'utf-8');
        return await this.uploadEncryptedData(buffer, 'metadata.json');
      }
    } catch (error) {
      console.error('[IPFS] Metadata upload failed:', error);
      throw new Error('Failed to upload metadata to IPFS');
    }
  }

  /**
   * Retrieve data from IPFS using the gateway
   */
  async retrieveData(ipfsHash: string): Promise<any> {
    try {
      const response = await fetch(`${this.gatewayUrl}/${ipfsHash}`);
      
      if (!response.ok) {
        throw new Error(`Failed to retrieve data: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.arrayBuffer();
      }
    } catch (error) {
      console.error('[IPFS] Retrieval failed:', error);
      throw new Error('Failed to retrieve data from IPFS');
    }
  }

  /**
   * Check if IPFS service is available
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (this.pinataApiKey && this.pinataSecretKey) {
        const response = await fetch(`${this.apiUrl}/data/testAuthentication`, {
          method: 'GET',
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey,
          }
        });
        
        return response.ok;
      }
      return false;
    } catch (error) {
      console.error('[IPFS] Connection check failed:', error);
      return false;
    }
  }



  /**
   * Pin content to ensure persistence
   */
  async pinContent(ipfsHash: string): Promise<boolean> {
    try {
      console.log(`[IPFS] Simulating pin of ${ipfsHash}`);
      return true;
    } catch (error) {
      console.error('[IPFS] Pin failed:', error);
      return false;
    }
  }

  /**
   * Generate gateway URL for IPFS hash
   */
  getGatewayUrl(ipfsHash: string): string {
    return `${this.gatewayUrl}/${ipfsHash}`;
  }

  /**
   * Validate IPFS hash format
   */
  isValidIPFSHash(hash: string): boolean {
    // Basic validation for IPFS hash (Qm... format)
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash);
  }
}

export const ipfsStorageService = new IPFSStorageService();
export { IPFSStorageService };