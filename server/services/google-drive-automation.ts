/**
 * Google Drive Automation Service
 * Automatically uploads files and manages Google Drive integration
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

interface DriveConfig {
  serviceAccountEmail?: string;
  privateKey?: string;
  clientId?: string;
  folderId?: string;
}

export class GoogleDriveAutomation {
  private drive: any;
  private auth: any;

  constructor(private config: DriveConfig) {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Option 1: Service Account (RECOMMENDED)
      if (this.config.serviceAccountEmail && this.config.privateKey) {
        this.auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: this.config.serviceAccountEmail,
            private_key: this.config.privateKey.replace(/\\n/g, '\n'),
          },
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
      }
      
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('[Google Drive] Authentication initialized successfully');
    } catch (error) {
      console.error('[Google Drive] Authentication failed:', error);
    }
  }

  /**
   * Upload a single file to Google Drive
   */
  async uploadFile(filePath: string, fileName?: string, folderId?: string): Promise<string | null> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive not initialized');
      }

      const fileMetadata = {
        name: fileName || path.basename(filePath),
        parents: folderId ? [folderId] : this.config.folderId ? [this.config.folderId] : undefined,
      };

      const media = {
        mimeType: this.getMimeType(filePath),
        body: fs.createReadStream(filePath),
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink',
      });

      console.log(`[Google Drive] Uploaded: ${response.data.name} (ID: ${response.data.id})`);
      return response.data.webViewLink;
    } catch (error) {
      console.error('[Google Drive] Upload failed:', error);
      return null;
    }
  }

  /**
   * Upload entire directory to Google Drive
   */
  async uploadDirectory(directoryPath: string, targetFolderId?: string): Promise<void> {
    try {
      const folderName = path.basename(directoryPath);
      
      // Create folder in Google Drive
      const folderId = await this.createFolder(folderName, targetFolderId);
      
      // Upload all files in directory
      const files = fs.readdirSync(directoryPath);
      const uploadPromises = files.map(async (file) => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          await this.uploadFile(filePath, file, folderId);
        }
      });

      await Promise.all(uploadPromises);
      console.log(`[Google Drive] Directory uploaded: ${directoryPath}`);
    } catch (error) {
      console.error('[Google Drive] Directory upload failed:', error);
    }
  }

  /**
   * Create folder in Google Drive
   */
  async createFolder(name: string, parentFolderId?: string): Promise<string> {
    try {
      const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : this.config.folderId ? [this.config.folderId] : undefined,
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      });

      console.log(`[Google Drive] Folder created: ${name} (ID: ${response.data.id})`);
      return response.data.id;
    } catch (error) {
      console.error('[Google Drive] Folder creation failed:', error);
      throw error;
    }
  }

  /**
   * Create HyperDAG folder structure
   */
  async createHyperDAGStructure(): Promise<string> {
    try {
      // Create main folder structure
      const mainFolderId = await this.createFolder('deFuzzyAI-Symphony');
      const videoGuruFolderId = await this.createFolder('09-AI-Video-Guru', mainFolderId);
      const hyperDagFolderId = await this.createFolder('HyperDagManager', videoGuruFolderId);
      
      // Create subfolders
      await this.createFolder('Code-Deployments', hyperDagFolderId);
      await this.createFolder('Hackathon-Database', hyperDagFolderId);
      await this.createFolder('Infrastructure', hyperDagFolderId);
      await this.createFolder('Trinity-Symphony', hyperDagFolderId);
      await this.createFolder('Demo-Materials', hyperDagFolderId);
      await this.createFolder('Final-Reports', hyperDagFolderId);

      console.log('[Google Drive] HyperDAG folder structure created');
      return hyperDagFolderId;
    } catch (error) {
      console.error('[Google Drive] Structure creation failed:', error);
      throw error;
    }
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.md': 'text/markdown',
      '.json': 'application/json',
      '.py': 'text/x-python',
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.yml': 'text/yaml',
      '.yaml': 'text/yaml',
      '.csv': 'text/csv',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Check authentication status
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      if (!this.auth) return false;
      await this.drive.files.list({ pageSize: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Initialize with environment variables
export const googleDriveService = new GoogleDriveAutomation({
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  privateKey: process.env.GOOGLE_PRIVATE_KEY,
  clientId: process.env.GOOGLE_CLIENT_ID,
  folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
});