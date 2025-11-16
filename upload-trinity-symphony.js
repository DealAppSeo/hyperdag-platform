#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'DealAppSeo';
const REPO = 'trinity-symphony-shared';

async function uploadCompetitivePackage() {
  if (!GITHUB_TOKEN) {
    console.log('❌ GITHUB_TOKEN not found');
    return;
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  try {
    // Check if repository exists, if not create it
    let repoExists = true;
    try {
      await octokit.rest.repos.get({ owner: OWNER, repo: REPO });
      console.log('✅ Repository exists');
    } catch (error) {
      if (error.status === 404) {
        repoExists = false;
        console.log('📁 Creating repository...');
        await octokit.rest.repos.createForAuthenticatedUser({
          name: REPO,
          description: 'Trinity Symphony AI collaboration repository for agent file sharing and task coordination',
          private: false,
          auto_init: true
        });
        console.log('✅ Repository created');
      } else {
        throw error;
      }
    }

    // Read competitive package directory
    const competitiveDir = 'hyperdagmanager_competitive_final_2025-08-07';
    const files = fs.readdirSync(competitiveDir);
    
    console.log(`📦 Found ${files.length} files to upload`);
    
    const uploadResults = [];
    
    for (const file of files) {
      const filePath = path.join(competitiveDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const githubPath = `competitive/${file}`;
          
          console.log(`📤 Uploading: ${file}...`);
          
          // Check if file exists to get SHA for updates
          let sha = undefined;
          try {
            const existing = await octokit.rest.repos.getContent({
              owner: OWNER,
              repo: REPO,
              path: githubPath,
            });
            if (!Array.isArray(existing.data) && existing.data.type === 'file') {
              sha = existing.data.sha;
            }
          } catch (error) {
            // File doesn't exist, continue without SHA
          }

          const result = await octokit.rest.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: REPO,
            path: githubPath,
            message: `Upload Trinity Symphony competitive file: ${file}`,
            content: Buffer.from(content).toString('base64'),
            sha: sha
          });
          
          uploadResults.push({
            file: file,
            success: true,
            url: result.data.content.html_url
          });
          
          console.log(`✅ Uploaded: ${file}`);
          
        } catch (error) {
          console.log(`❌ Failed to upload ${file}: ${error.message}`);
          uploadResults.push({
            file: file,
            success: false,
            error: error.message
          });
        }
      }
    }
    
    // Create README.md
    const readmeContent = `# Trinity Symphony Shared Repository

## 🎯 Purpose
This repository contains Trinity Symphony competitive materials and serves as a collaboration hub for AI agents.

## 📁 Structure
- \`competitive/\` - Trinity Symphony competition files (1000 points)
- \`tasks/\` - Agent collaboration tasks
- \`documents/\` - Shared documents and analysis
- \`agents/\` - Agent-specific folders

## 🚀 Competitive Package
Uploaded: ${new Date().toISOString()}
Files: ${uploadResults.filter(r => r.success).length}/${uploadResults.length} successful

## 🔗 Repository URL
https://github.com/${OWNER}/${REPO}

## 📋 Files Uploaded
${uploadResults.map(r => `- ${r.success ? '✅' : '❌'} ${r.file}${r.url ? ` - [View](${r.url})` : ''}`).join('\n')}

---
*Generated automatically by Trinity Symphony upload system*
`;

    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path: 'README.md',
        message: 'Create Trinity Symphony repository README',
        content: Buffer.from(readmeContent).toString('base64')
      });
      console.log('✅ Created README.md');
    } catch (error) {
      console.log(`⚠️ README creation failed: ${error.message}`);
    }
    
    // Summary
    const successful = uploadResults.filter(r => r.success).length;
    const failed = uploadResults.filter(r => !r.success).length;
    
    console.log('\n🎉 Upload Summary:');
    console.log(`✅ Successful uploads: ${successful}`);
    console.log(`❌ Failed uploads: ${failed}`);
    console.log(`📁 Repository: https://github.com/${OWNER}/${REPO}`);
    
    if (successful > 0) {
      console.log('\n🔗 Direct links:');
      uploadResults.filter(r => r.success).slice(0, 5).forEach(r => {
        console.log(`   ${r.file}: ${r.url}`);
      });
      if (successful > 5) {
        console.log(`   ... and ${successful - 5} more files`);
      }
    }
    
    return { successful, failed, repositoryUrl: `https://github.com/${OWNER}/${REPO}` };
    
  } catch (error) {
    console.log(`❌ Upload failed: ${error.message}`);
    throw error;
  }
}

// Run the upload
uploadCompetitivePackage()
  .then(result => {
    if (result) {
      console.log('\n🚀 Trinity Symphony competitive package successfully uploaded!');
      console.log('Repository ready for agent collaboration.');
    }
  })
  .catch(error => {
    console.error('Upload failed:', error.message);
    process.exit(1);
  });