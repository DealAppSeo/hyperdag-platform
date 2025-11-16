import { ipfsService } from './IPFSService';
import OrbitDB from 'orbit-db';
import type { Store } from 'orbit-db-store';

// OrbitDB Service for distributed database functionality
class OrbitDBService {
  private orbitdb: OrbitDB | null = null;
  private databases: Record<string, Store> = {};
  private isInitialized = false;
  
  // Initialize OrbitDB with IPFS
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Make sure IPFS is initialized
      await ipfsService.initialize();
      
      // Create OrbitDB instance
      this.orbitdb = await OrbitDB.createInstance((ipfsService as any).helia);
      this.isInitialized = true;
      console.log('OrbitDB initialized successfully');
    } catch (err) {
      console.error('Failed to initialize OrbitDB:', err);
      throw err;
    }
  }
  
  // Open or create a key-value database
  public async openKeyValueDB(name: string): Promise<Store> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.databases[name]) {
      return this.databases[name];
    }
    
    try {
      const db = await this.orbitdb?.keyvalue(name, {
        accessController: {
          write: ['*'], // Everyone can write by default
        },
      });
      
      if (!db) {
        throw new Error(`Failed to open database: ${name}`);
      }
      
      // Load locally persisted data
      await db.load();
      
      this.databases[name] = db;
      return db;
    } catch (err) {
      console.error(`Failed to open database ${name}:`, err);
      throw err;
    }
  }
  
  // Open or create a document database (for JSON documents)
  public async openDocumentDB(name: string): Promise<Store> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.databases[name]) {
      return this.databases[name];
    }
    
    try {
      const db = await this.orbitdb?.docs(name, {
        accessController: {
          write: ['*'], // Everyone can write by default
        },
      });
      
      if (!db) {
        throw new Error(`Failed to open database: ${name}`);
      }
      
      // Load locally persisted data
      await db.load();
      
      this.databases[name] = db;
      return db;
    } catch (err) {
      console.error(`Failed to open database ${name}:`, err);
      throw err;
    }
  }
  
  // Store a document in a document database
  public async addDocument(dbName: string, doc: Record<string, any>): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    let db = this.databases[dbName];
    if (!db) {
      db = await this.openDocumentDB(dbName);
    }
    
    try {
      // Add the document to the database
      const hash = await db.put(doc);
      return hash;
    } catch (err) {
      console.error(`Failed to add document to ${dbName}:`, err);
      throw err;
    }
  }
  
  // Get all documents from a document database
  public async getAllDocuments(dbName: string): Promise<Array<Record<string, any>>> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    let db = this.databases[dbName];
    if (!db) {
      db = await this.openDocumentDB(dbName);
    }
    
    try {
      // Get all documents
      return db.get('');
    } catch (err) {
      console.error(`Failed to get documents from ${dbName}:`, err);
      throw err;
    }
  }
  
  // Query documents by field
  public async queryDocuments(
    dbName: string, 
    field: string, 
    value: any
  ): Promise<Array<Record<string, any>>> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    let db = this.databases[dbName];
    if (!db) {
      db = await this.openDocumentDB(dbName);
    }
    
    try {
      // Query documents by field
      return db.query((doc: Record<string, any>) => doc[field] === value);
    } catch (err) {
      console.error(`Failed to query documents from ${dbName}:`, err);
      throw err;
    }
  }
  
  // Close all databases
  public async close(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      // Close all databases
      await Promise.all(
        Object.values(this.databases).map(db => db.close())
      );
      
      // Close OrbitDB
      await this.orbitdb?.stop();
      
      this.databases = {};
      this.orbitdb = null;
      this.isInitialized = false;
    } catch (err) {
      console.error('Failed to close OrbitDB:', err);
      throw err;
    }
  }
}

// Export singleton instance
export const orbitDBService = new OrbitDBService();