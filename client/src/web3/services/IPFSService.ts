import { createHelia } from 'helia';
import { json } from '@helia/json';
import type { Helia } from '@helia/interface';
import type { CID } from 'multiformats/cid';
import { Web3Storage } from 'web3.storage';

// IPFS Service for storing and retrieving data using Helia and web3.storage
class IPFSService {
  private helia: Helia | null = null;
  private jsonHandler: any = null;
  private web3Storage: Web3Storage | null = null;
  private isInitialized = false;
  private isWeb3StorageInitialized = false;
  
  // Initialize Helia IPFS client
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Create a Helia instance
      this.helia = await createHelia();
      this.jsonHandler = json(this.helia);
      this.isInitialized = true;
      console.log('IPFS initialized successfully');
    } catch (err) {
      console.error('Failed to initialize IPFS:', err);
      throw err;
    }
  }
  
  // Initialize Web3.Storage client
  public async initializeWeb3Storage(token: string): Promise<void> {
    if (this.isWeb3StorageInitialized) return;
    
    try {
      // Create a web3.storage client
      this.web3Storage = new Web3Storage({ token });
      this.isWeb3StorageInitialized = true;
      console.log('Web3.Storage initialized successfully');
    } catch (err) {
      console.error('Failed to initialize Web3.Storage:', err);
      throw err;
    }
  }
  
  // Store JSON data on IPFS
  public async storeJSON<T extends object>(data: T): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Store the JSON data and get the CID
      const cid = await this.jsonHandler.add(data);
      return cid.toString();
    } catch (err) {
      console.error('Failed to store data on IPFS:', err);
      throw err;
    }
  }
  
  // Retrieve JSON data from IPFS
  public async getJSON<T>(cidString: string): Promise<T> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Parse the CID string
      const cid = this.parseCID(cidString);
      
      // Retrieve the data from IPFS
      const data = await this.jsonHandler.get(cid);
      return data as T;
    } catch (err) {
      console.error('Failed to retrieve data from IPFS:', err);
      throw err;
    }
  }
  
  // Helper to parse CID string
  private parseCID(cidString: string): CID {
    try {
      // Import CID dynamically to avoid build issues
      const { CID } = require('multiformats/cid');
      return CID.parse(cidString);
    } catch (err) {
      console.error('Failed to parse CID:', err);
      throw new Error(`Invalid CID: ${cidString}`);
    }
  }
  
  // Store a file on IPFS (convenience method)
  public async storeFile(file: File): Promise<string> {
    // If web3.storage is initialized, use it for more persistent storage
    if (this.isWeb3StorageInitialized && this.web3Storage) {
      try {
        // Store the file directly
        const cid = await this.web3Storage.put([file], {
          name: file.name,
          maxRetries: 3
        });
        return cid;
      } catch (err) {
        console.error('Failed to store file with web3.storage, falling back to Helia:', err);
        // Fall through to Helia method if web3.storage fails
      }
    }
    
    // Fallback to Helia
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Convert file to buffer
      const buffer = await file.arrayBuffer();
      
      // Store the buffer and get the CID
      const cid = await this.helia?.blockstore.put(new Uint8Array(buffer), { signal: AbortSignal.timeout(30000) });
      return cid?.toString() || '';
    } catch (err) {
      console.error('Failed to store file on IPFS:', err);
      throw err;
    }
  }
  
  // Get a file from IPFS as a blob
  public async getFile(cidString: string): Promise<Blob> {
    // Try to get from web3.storage first if initialized
    if (this.isWeb3StorageInitialized && this.web3Storage) {
      try {
        const res = await fetch(`https://${cidString}.ipfs.w3s.link`);
        if (res.ok) {
          return await res.blob();
        }
        // Fall through to Helia if fetch fails or returns non-ok status
      } catch (err) {
        console.error('Failed to retrieve from web3.storage gateway, falling back to Helia:', err);
        // Fall through to Helia method
      }
    }

    // Fallback to Helia
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      const cid = this.parseCID(cidString);
      
      // Get the data from IPFS as a buffer
      const chunks: Uint8Array[] = [];
      const signal = AbortSignal.timeout(30000); // 30 second timeout
      
      if (this.helia?.blockstore) {
        for await (const chunk of this.helia.blockstore.get(cid, { signal })) {
          chunks.push(chunk);
        }
      }
      
      if (chunks.length === 0) {
        throw new Error(`No data found for CID: ${cidString}`);
      }
      
      // Combine chunks into a single Uint8Array
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const allChunks = new Uint8Array(totalLength);
      
      let offset = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, offset);
        offset += chunk.length;
      }
      
      return new Blob([allChunks]);
    } catch (err) {
      console.error('Failed to retrieve file from IPFS:', err);
      throw err;
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();