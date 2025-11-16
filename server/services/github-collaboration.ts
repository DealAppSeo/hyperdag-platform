import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

export interface GitHubFile {
  name: string;
  content: string;
  path: string;
  sha?: string;
}

export interface CollaborationConfig {
  owner: string;
  repo: string;
  token: string;
  defaultBranch?: string;
}

export class GitHubCollaborationService {
  private octokit: Octokit;
  private config: CollaborationConfig;

  constructor(config: CollaborationConfig) {
    this.config = {
      defaultBranch: 'main',
      ...config
    };
    
    this.octokit = new Octokit({
      auth: this.config.token,
    });
  }

  /**
   * Upload a single file to GitHub repository
   */
  async uploadFile(filePath: string, content: string, message?: string): Promise<any> {
    try {
      // Check if file exists to get SHA for updates
      let sha: string | undefined;
      try {
        const existing = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path: filePath,
        });
        
        if (!Array.isArray(existing.data) && existing.data.type === 'file') {
          sha = existing.data.sha;
        }
      } catch (error) {
        // File doesn't exist, continue without SHA
      }

      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message: message || `Update ${filePath}`,
        content: Buffer.from(content).toString('base64'),
        branch: this.config.defaultBranch,
        ...(sha && { sha }),
      });

      return {
        success: true,
        url: response.data.content?.html_url,
        downloadUrl: response.data.content?.download_url,
        sha: response.data.content?.sha,
      };
    } catch (error) {
      console.error(`Failed to upload ${filePath}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload local file to GitHub
   */
  async uploadLocalFile(localFilePath: string, remoteFilePath?: string, message?: string): Promise<any> {
    try {
      const content = fs.readFileSync(localFilePath, 'utf8');
      const remotePath = remoteFilePath || path.basename(localFilePath);
      
      return await this.uploadFile(remotePath, content, message);
    } catch (error) {
      console.error(`Failed to read local file ${localFilePath}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read local file',
      };
    }
  }

  /**
   * Upload entire directory to GitHub
   */
  async uploadDirectory(localDirPath: string, remoteDirPath: string = '', message?: string): Promise<any[]> {
    const results: any[] = [];
    
    try {
      const files = this.getFilesRecursively(localDirPath);
      
      for (const file of files) {
        const relativePath = path.relative(localDirPath, file);
        const remotePath = path.join(remoteDirPath, relativePath).replace(/\\/g, '/');
        
        const result = await this.uploadLocalFile(file, remotePath, message);
        results.push({
          localPath: file,
          remotePath,
          ...result,
        });
      }
    } catch (error) {
      console.error(`Failed to upload directory ${localDirPath}:`, error);
    }
    
    return results;
  }

  /**
   * Create a GitHub Gist for quick file sharing
   */
  async createGist(files: GitHubFile[], description: string, isPublic: boolean = false): Promise<any> {
    try {
      const gistFiles: Record<string, { content: string }> = {};
      
      files.forEach(file => {
        gistFiles[file.name] = { content: file.content };
      });

      const response = await this.octokit.rest.gists.create({
        description,
        public: isPublic,
        files: gistFiles,
      });

      return {
        success: true,
        id: response.data.id,
        url: response.data.html_url,
        cloneUrl: response.data.git_pull_url,
        files: response.data.files,
      };
    } catch (error) {
      console.error('Failed to create gist:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get file content from GitHub
   */
  async getFile(filePath: string): Promise<any> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
      });

      if (!Array.isArray(response.data) && response.data.type === 'file') {
        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        return {
          success: true,
          content,
          sha: response.data.sha,
          downloadUrl: response.data.download_url,
        };
      }

      return {
        success: false,
        error: 'File not found or is a directory',
      };
    } catch (error) {
      console.error(`Failed to get file ${filePath}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List files in repository
   */
  async listFiles(dirPath: string = ''): Promise<any> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: dirPath,
      });

      if (Array.isArray(response.data)) {
        return {
          success: true,
          files: response.data.map(item => ({
            name: item.name,
            path: item.path,
            type: item.type,
            size: item.size,
            downloadUrl: item.download_url,
          })),
        };
      }

      return {
        success: false,
        error: 'Path is not a directory',
      };
    } catch (error) {
      console.error(`Failed to list files in ${dirPath}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add collaborators to repository
   */
  async addCollaborator(username: string, permission: 'pull' | 'push' | 'admin' = 'push'): Promise<any> {
    try {
      await this.octokit.rest.repos.addCollaborator({
        owner: this.config.owner,
        repo: this.config.repo,
        username,
        permission,
      });

      return {
        success: true,
        message: `Added ${username} as collaborator with ${permission} permission`,
      };
    } catch (error) {
      console.error(`Failed to add collaborator ${username}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create repository if it doesn't exist
   */
  async createRepository(description: string, isPrivate: boolean = false): Promise<any> {
    try {
      const response = await this.octokit.rest.repos.createForAuthenticatedUser({
        name: this.config.repo,
        description,
        private: isPrivate,
        auto_init: true,
      });

      return {
        success: true,
        url: response.data.html_url,
        cloneUrl: response.data.clone_url,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        return {
          success: true,
          message: 'Repository already exists',
        };
      }
      
      console.error('Failed to create repository:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload Trinity Symphony competitive package
   */
  async uploadCompetitivePackage(): Promise<any> {
    const packageDir = './hyperdagmanager_competitive_final_2025-08-07';
    
    if (!fs.existsSync(packageDir)) {
      return {
        success: false,
        error: 'Competitive package directory not found',
      };
    }

    const message = `Upload Trinity Symphony Competitive Package - ${new Date().toISOString()}`;
    const results = await this.uploadDirectory(packageDir, 'trinity-symphony-competitive', message);
    
    const successfulUploads = results.filter(r => r.success);
    const failedUploads = results.filter(r => !r.success);
    
    return {
      success: failedUploads.length === 0,
      uploaded: successfulUploads.length,
      failed: failedUploads.length,
      results,
      summary: `Uploaded ${successfulUploads.length}/${results.length} files successfully`,
    };
  }

  private getFilesRecursively(dirPath: string): string[] {
    const files: string[] = [];
    
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }
}