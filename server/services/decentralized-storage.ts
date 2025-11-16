/**
 * Decentralized Storage Service for HyperDAG
 * 
 * Provides distributed storage capabilities with persistent state management
 * and cost arbitrage across multiple decentralized storage networks
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

interface StorageProvider {
  id: string;
  name: string;
  endpoint: string;
  pricing: {
    storagePerGBMonth: number;
    retrievalPerGB: number;
    operationsPerK: number;
    bandwidthPerGB: number;
  };
  capabilities: {
    maxFileSize: number; // GB
    replicationFactor: number;
    availability: number; // 9s (99.9%, 99.99%, etc)
    regions: string[];
    encryption: boolean;
    versioning: boolean;
  };
  performance: {
    uploadSpeed: number; // Mbps
    downloadSpeed: number; // Mbps
    latency: number; // ms
  };
  currentLoad: number; // 0-1
  reputation: number; // 0-1
}

interface StorageFile {
  id: string;
  name: string;
  size: number; // bytes
  hash: string;
  providers: string[]; // Which providers store this file
  replicas: number;
  uploadTime: Date;
  lastAccessed: Date;
  metadata: any;
  persistentState?: any;
  costPerMonth: number;
}

interface ArbitrageOpportunity {
  fileId: string;
  currentProvider: string;
  targetProvider: string;
  monthlySavings: number;
  migrationCost: number;
  netSavings: number;
  paybackPeriod: number; // months
}

export class DecentralizedStorageService extends EventEmitter {
  private providers: Map<string, StorageProvider> = new Map();
  private files: Map<string, StorageFile> = new Map();
  private persistentStates: Map<string, any> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.initializeProviders();
  }

  /**
   * Initialize decentralized storage providers
   */
  private initializeProviders(): void {
    // IPFS with Pinata - Popular IPFS pinning service
    this.providers.set('pinata', {
      id: 'pinata',
      name: 'Pinata (IPFS)',
      endpoint: 'https://api.pinata.cloud',
      pricing: {
        storagePerGBMonth: 0.20,
        retrievalPerGB: 0.01,
        operationsPerK: 0.10,
        bandwidthPerGB: 0.05
      },
      capabilities: {
        maxFileSize: 1,
        replicationFactor: 3,
        availability: 99.9,
        regions: ['global'],
        encryption: true,
        versioning: true
      },
      performance: {
        uploadSpeed: 50,
        downloadSpeed: 100,
        latency: 150
      },
      currentLoad: 0.35,
      reputation: 0.92
    });

    // Arweave - Permanent storage blockchain
    this.providers.set('arweave', {
      id: 'arweave',
      name: 'Arweave',
      endpoint: 'https://arweave.net',
      pricing: {
        storagePerGBMonth: 2.50, // One-time payment for permanent storage
        retrievalPerGB: 0.001,
        operationsPerK: 0.05,
        bandwidthPerGB: 0.02
      },
      capabilities: {
        maxFileSize: 12,
        replicationFactor: 200, // Highly replicated
        availability: 99.99,
        regions: ['global'],
        encryption: true,
        versioning: false
      },
      performance: {
        uploadSpeed: 30,
        downloadSpeed: 80,
        latency: 200
      },
      currentLoad: 0.22,
      reputation: 0.95
    });

    // Storj - Decentralized cloud storage
    this.providers.set('storj', {
      id: 'storj',
      name: 'Storj',
      endpoint: 'https://gateway.storjshare.io',
      pricing: {
        storagePerGBMonth: 0.004,
        retrievalPerGB: 0.007,
        operationsPerK: 0.001,
        bandwidthPerGB: 0.007
      },
      capabilities: {
        maxFileSize: 5,
        replicationFactor: 2.7,
        availability: 99.95,
        regions: ['us-east', 'us-west', 'europe', 'asia'],
        encryption: true,
        versioning: true
      },
      performance: {
        uploadSpeed: 80,
        downloadSpeed: 120,
        latency: 100
      },
      currentLoad: 0.18,
      reputation: 0.89
    });

    // Sia - Decentralized storage network
    this.providers.set('sia', {
      id: 'sia',
      name: 'Sia Network',
      endpoint: 'https://api.sia.tech',
      pricing: {
        storagePerGBMonth: 0.002,
        retrievalPerGB: 0.02,
        operationsPerK: 0.001,
        bandwidthPerGB: 0.02
      },
      capabilities: {
        maxFileSize: 40,
        replicationFactor: 10,
        availability: 99.9,
        regions: ['global'],
        encryption: true,
        versioning: false
      },
      performance: {
        uploadSpeed: 60,
        downloadSpeed: 90,
        latency: 180
      },
      currentLoad: 0.28,
      reputation: 0.86
    });

    // Web3.Storage - IPFS and Filecoin integration
    this.providers.set('web3storage', {
      id: 'web3storage',
      name: 'Web3.Storage',
      endpoint: 'https://api.web3.storage',
      pricing: {
        storagePerGBMonth: 0.15,
        retrievalPerGB: 0.001,
        operationsPerK: 0.05,
        bandwidthPerGB: 0.01
      },
      capabilities: {
        maxFileSize: 32,
        replicationFactor: 5,
        availability: 99.95,
        regions: ['global'],
        encryption: true,
        versioning: true
      },
      performance: {
        uploadSpeed: 70,
        downloadSpeed: 110,
        latency: 120
      },
      currentLoad: 0.31,
      reputation: 0.91
    });

    console.log('[DecentralizedStorage] Initialized with 5 storage providers');
    this.isInitialized = true;
  }

  /**
   * Calculate optimal storage provider using arbitrage analysis
   */
  private calculateOptimalProvider(
    fileSize: number, 
    duration: number, 
    accessPattern: 'archive' | 'frequent' | 'backup' | 'streaming'
  ): StorageProvider | null {
    const suitableProviders = Array.from(this.providers.values()).filter(provider => 
      provider.capabilities.maxFileSize >= (fileSize / (1024 * 1024 * 1024)) && // Convert to GB
      provider.currentLoad < 0.8 &&
      provider.reputation > 0.8
    );

    if (suitableProviders.length === 0) return null;

    // Calculate total cost for each provider
    const providerCosts = suitableProviders.map(provider => {
      const fileSizeGB = fileSize / (1024 * 1024 * 1024);
      const months = duration / (30 * 24 * 60 * 60 * 1000); // Convert to months
      
      let storageCost = provider.pricing.storagePerGBMonth * fileSizeGB * months;
      
      // For Arweave, it's one-time payment
      if (provider.id === 'arweave') {
        storageCost = provider.pricing.storagePerGBMonth * fileSizeGB;
      }

      // Estimate retrieval costs based on access pattern
      let retrievalMultiplier = 1;
      switch (accessPattern) {
        case 'frequent': retrievalMultiplier = 10; break;
        case 'streaming': retrievalMultiplier = 50; break;
        case 'backup': retrievalMultiplier = 0.1; break;
        case 'archive': retrievalMultiplier = 0.01; break;
      }

      const retrievalCost = provider.pricing.retrievalPerGB * fileSizeGB * retrievalMultiplier;
      const operationsCost = provider.pricing.operationsPerK * 0.1; // Estimate operations
      const bandwidthCost = provider.pricing.bandwidthPerGB * fileSizeGB * retrievalMultiplier;

      const totalCost = storageCost + retrievalCost + operationsCost + bandwidthCost;

      // Calculate score considering cost, performance, and reliability
      const performanceScore = (
        (provider.performance.uploadSpeed / 100) * 0.3 +
        (provider.performance.downloadSpeed / 100) * 0.3 +
        (1 - provider.performance.latency / 300) * 0.2 +
        (provider.capabilities.availability / 100) * 0.2
      );

      const score = (
        provider.reputation * 0.3 +
        performanceScore * 0.25 +
        (1 - provider.currentLoad) * 0.2 +
        (provider.capabilities.replicationFactor / 200) * 0.15 +
        (1 / (totalCost + 0.01)) * 0.1 // Inverse of cost
      );

      return {
        provider,
        totalCost,
        storageCost,
        retrievalCost,
        score
      };
    });

    // Sort by best score
    providerCosts.sort((a, b) => b.score - a.score);
    
    const optimal = providerCosts[0];
    console.log(`[DecentralizedStorage] Selected ${optimal.provider.name} - Cost: $${optimal.totalCost.toFixed(4)} (Score: ${optimal.score.toFixed(3)})`);
    
    return optimal.provider;
  }

  /**
   * Store file with persistent state management
   */
  async storeFile(
    fileName: string,
    data: Buffer | string,
    options: {
      accessPattern?: 'archive' | 'frequent' | 'backup' | 'streaming';
      duration?: number; // milliseconds
      replicas?: number;
      metadata?: any;
      persistentState?: any;
    } = {}
  ): Promise<string> {
    const fileId = crypto.createHash('sha256').update(data).digest('hex');
    const fileSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
    const hash = crypto.createHash('md5').update(data).digest('hex');

    const {
      accessPattern = 'frequent',
      duration = 30 * 24 * 60 * 60 * 1000, // 30 days default
      replicas = 3,
      metadata = {},
      persistentState = {}
    } = options;

    // Find optimal provider
    const optimalProvider = this.calculateOptimalProvider(fileSize, duration, accessPattern);
    
    if (!optimalProvider) {
      throw new Error('No suitable storage provider available');
    }

    // Calculate monthly cost
    const fileSizeGB = fileSize / (1024 * 1024 * 1024);
    const months = duration / (30 * 24 * 60 * 60 * 1000);
    
    let monthlyCost = optimalProvider.pricing.storagePerGBMonth * fileSizeGB;
    if (optimalProvider.id === 'arweave') {
      monthlyCost = optimalProvider.pricing.storagePerGBMonth * fileSizeGB / months; // Amortize one-time cost
    }

    const file: StorageFile = {
      id: fileId,
      name: fileName,
      size: fileSize,
      hash,
      providers: [optimalProvider.id],
      replicas,
      uploadTime: new Date(),
      lastAccessed: new Date(),
      metadata,
      persistentState,
      costPerMonth: monthlyCost
    };

    this.files.set(fileId, file);

    // Store persistent state separately
    if (persistentState && Object.keys(persistentState).length > 0) {
      this.persistentStates.set(fileId, {
        ...persistentState,
        storedAt: new Date(),
        provider: optimalProvider.name,
        accessPattern
      });
    }

    // Simulate storage operation
    await this.simulateStorage(fileId, optimalProvider.id, data);

    console.log(`[DecentralizedStorage] File ${fileName} stored with ID ${fileId} on ${optimalProvider.name}`);
    this.emit('fileStored', { fileId, fileName, provider: optimalProvider.name, cost: monthlyCost });

    return fileId;
  }

  /**
   * Simulate storage operation
   */
  private async simulateStorage(fileId: string, providerId: string, data: Buffer | string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    // Simulate upload time based on file size and provider speed
    const file = this.files.get(fileId);
    if (!file) throw new Error(`File ${fileId} not found`);

    const uploadTimeMs = (file.size / (1024 * 1024)) / (provider.performance.uploadSpeed / 8) * 1000;
    const simulatedDelay = Math.min(uploadTimeMs, 5000); // Cap at 5 seconds for demo

    return new Promise(resolve => {
      setTimeout(() => {
        // Update provider load
        provider.currentLoad = Math.min(1, provider.currentLoad + 0.05);
        
        console.log(`[DecentralizedStorage] Upload complete to ${provider.name} (${simulatedDelay.toFixed(0)}ms)`);
        resolve();
      }, simulatedDelay);
    });
  }

  /**
   * Find arbitrage opportunities for cost optimization
   */
  findArbitrageOpportunities(): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    this.files.forEach((file, fileId) => {
      const currentProvider = this.providers.get(file.providers[0]);
      if (!currentProvider) return;

      // Check all other providers for better pricing
      this.providers.forEach((provider, providerId) => {
        if (providerId === currentProvider.id) return;
        if (provider.currentLoad > 0.7) return; // Skip overloaded providers
        
        const fileSizeGB = file.size / (1024 * 1024 * 1024);
        
        // Calculate current monthly cost
        let currentMonthlyCost = currentProvider.pricing.storagePerGBMonth * fileSizeGB;
        
        // Calculate target monthly cost
        let targetMonthlyCost = provider.pricing.storagePerGBMonth * fileSizeGB;
        
        const monthlySavings = currentMonthlyCost - targetMonthlyCost;
        
        if (monthlySavings > 0.01) { // At least 1 cent savings
          // Estimate migration cost (retrieval + upload)
          const migrationCost = 
            currentProvider.pricing.retrievalPerGB * fileSizeGB +
            provider.pricing.operationsPerK * 0.001 + // Minimal operations
            provider.pricing.bandwidthPerGB * fileSizeGB * 0.1; // Upload bandwidth

          const netSavings = monthlySavings;
          const paybackPeriod = migrationCost / monthlySavings;

          if (paybackPeriod < 6) { // Payback within 6 months
            opportunities.push({
              fileId,
              currentProvider: currentProvider.name,
              targetProvider: provider.name,
              monthlySavings,
              migrationCost,
              netSavings,
              paybackPeriod
            });
          }
        }
      });
    });

    // Sort by highest net savings
    opportunities.sort((a, b) => b.netSavings - a.netSavings);
    
    return opportunities;
  }

  /**
   * Execute arbitrage migration
   */
  async executeArbitrage(fileId: string, targetProviderId: string): Promise<boolean> {
    const file = this.files.get(fileId);
    if (!file) throw new Error(`File ${fileId} not found`);

    const targetProvider = this.providers.get(targetProviderId);
    if (!targetProvider) throw new Error(`Provider ${targetProviderId} not found`);

    try {
      console.log(`[DecentralizedStorage] Migrating ${file.name} to ${targetProvider.name} for cost optimization`);

      // Simulate migration
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update file record
      const oldProvider = file.providers[0];
      file.providers = [targetProviderId];
      
      // Recalculate cost
      const fileSizeGB = file.size / (1024 * 1024 * 1024);
      file.costPerMonth = targetProvider.pricing.storagePerGBMonth * fileSizeGB;

      console.log(`[DecentralizedStorage] Migration complete: ${file.name} moved from ${oldProvider} to ${targetProvider.name}`);
      this.emit('fileMigrated', { fileId, oldProvider, newProvider: targetProvider.name });

      return true;
    } catch (error) {
      console.error(`[DecentralizedStorage] Migration failed for ${fileId}:`, error.message);
      return false;
    }
  }

  /**
   * Get persistent state for a file
   */
  getPersistentState(fileId: string): any {
    return this.persistentStates.get(fileId);
  }

  /**
   * Update persistent state for a file
   */
  updatePersistentState(fileId: string, state: any): void {
    const existing = this.persistentStates.get(fileId) || {};
    this.persistentStates.set(fileId, {
      ...existing,
      ...state,
      lastUpdated: new Date()
    });
  }

  /**
   * Get comprehensive status
   */
  getStatus(): any {
    const files = Array.from(this.files.values());
    const totalStorageCost = files.reduce((sum, file) => sum + file.costPerMonth, 0);
    const arbitrageOpportunities = this.findArbitrageOpportunities();
    const potentialSavings = arbitrageOpportunities.reduce((sum, opp) => sum + opp.netSavings, 0);

    return {
      isInitialized: this.isInitialized,
      totalProviders: this.providers.size,
      totalFiles: this.files.size,
      totalStorageSize: files.reduce((sum, file) => sum + file.size, 0),
      monthlyStorageCost: totalStorageCost,
      persistentStates: this.persistentStates.size,
      arbitrageOpportunities: arbitrageOpportunities.length,
      potentialMonthlySavings: potentialSavings,
      providers: Object.fromEntries(
        Array.from(this.providers.entries()).map(([id, provider]) => [
          id, {
            name: provider.name,
            currentLoad: provider.currentLoad,
            reputation: provider.reputation,
            pricing: provider.pricing,
            performance: provider.performance
          }
        ])
      ),
      topArbitrageOpportunities: arbitrageOpportunities.slice(0, 5)
    };
  }

  /**
   * Get current pricing across all providers
   */
  getCurrentPricing(): { [providerId: string]: any } {
    const pricing: any = {};
    this.providers.forEach((provider, id) => {
      pricing[id] = {
        ...provider.pricing,
        loadMultiplier: 1 + (provider.currentLoad * 0.2),
        effectiveStorageCost: provider.pricing.storagePerGBMonth * (1 + provider.currentLoad * 0.2),
        reputation: provider.reputation,
        performance: provider.performance
      };
    });
    return pricing;
  }

  /**
   * Retrieve file metadata and persistent state
   */
  getFileInfo(fileId: string): any {
    const file = this.files.get(fileId);
    if (!file) return null;

    const persistentState = this.persistentStates.get(fileId);
    const provider = this.providers.get(file.providers[0]);

    return {
      ...file,
      persistentState,
      provider: provider?.name,
      storageLocation: provider?.name
    };
  }
}

export const decentralizedStorage = new DecentralizedStorageService();