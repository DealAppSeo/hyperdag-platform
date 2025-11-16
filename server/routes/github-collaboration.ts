import express from 'express';
import { GitHubCollaborationService } from '../services/github-collaboration';

const router = express.Router();

// Initialize GitHub service with environment variables
const getGitHubService = () => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'defuzzyai'; // Default owner
  const repo = process.env.GITHUB_REPO || 'trinity-symphony-shared'; // Default repo

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  return new GitHubCollaborationService({ token, owner, repo });
};

/**
 * Test GitHub connection
 */
router.get('/test-connection', async (req, res) => {
  try {
    const github = getGitHubService();
    const result = await github.listFiles();
    
    res.json({
      success: true,
      message: 'GitHub connection successful',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Upload a file to GitHub repository
 */
router.post('/upload-file', async (req, res) => {
  try {
    const { filePath, content, message } = req.body;
    
    if (!filePath || !content) {
      return res.status(400).json({
        success: false,
        error: 'filePath and content are required',
      });
    }

    const github = getGitHubService();
    const result = await github.uploadFile(filePath, content, message);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Upload competitive package to GitHub
 */
router.post('/upload-competitive-package', async (req, res) => {
  try {
    const github = getGitHubService();
    const result = await github.uploadCompetitivePackage();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create a GitHub Gist for quick sharing
 */
router.post('/create-gist', async (req, res) => {
  try {
    const { files, description, isPublic } = req.body;
    
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: 'files array is required',
      });
    }

    const github = getGitHubService();
    const result = await github.createGist(files, description || 'Trinity Symphony Gist', isPublic || false);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get file content from GitHub
 */
router.get('/get-file/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    
    const github = getGitHubService();
    const result = await github.getFile(filePath);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List files in repository
 */
router.get('/list-files', async (req, res) => {
  try {
    const dirPath = req.query.path as string || '';
    
    const github = getGitHubService();
    const result = await github.listFiles(dirPath);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Add collaborator to repository
 */
router.post('/add-collaborator', async (req, res) => {
  try {
    const { username, permission } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'username is required',
      });
    }

    const github = getGitHubService();
    const result = await github.addCollaborator(username, permission || 'push');
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create repository
 */
router.post('/create-repository', async (req, res) => {
  try {
    const { description, isPrivate } = req.body;
    
    const github = getGitHubService();
    const result = await github.createRepository(
      description || 'Trinity Symphony collaboration repository', 
      isPrivate || false
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create task file and upload to GitHub
 */
router.post('/create-task', async (req, res) => {
  try {
    const { title, description, priority, assignee, dueDate } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'title is required',
      });
    }

    // Create task content
    const taskContent = `# ${title}

## Description
${description || 'No description provided'}

## Details
- **Priority**: ${priority || 'Medium'}
- **Assignee**: ${assignee || 'Unassigned'}
- **Due Date**: ${dueDate || 'Not set'}
- **Created**: ${new Date().toISOString()}
- **Status**: Pending

## Notes
Add task notes and progress updates here...

---
*Created by Trinity Symphony System*
`;

    const fileName = `tasks/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
    
    const github = getGitHubService();
    const result = await github.uploadFile(fileName, taskContent, `Create task: ${title}`);
    
    res.json({
      ...result,
      taskFile: fileName,
      taskContent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Upload local file from server
 */
router.post('/upload-local-file', async (req, res) => {
  try {
    const { localPath, remotePath, message } = req.body;
    
    if (!localPath) {
      return res.status(400).json({
        success: false,
        error: 'localPath is required',
      });
    }

    const github = getGitHubService();
    const result = await github.uploadLocalFile(localPath, remotePath, message);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;