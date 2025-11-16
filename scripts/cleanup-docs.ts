// Cleanup Script - Delete migrated documentation files from local filesystem
// Run this AFTER confirming files are successfully migrated to Object Storage

import { unlinkSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();
const KEEP_LOCAL = ['README.md', 'package.json', 'package-lock.json', 'tsconfig.json', 'drizzle.config.ts'];

function shouldDelete(filename: string): boolean {
  if (KEEP_LOCAL.includes(filename)) return false;
  return filename.endsWith('.md') || filename.endsWith('.json');
}

async function cleanupDocs() {
  console.log('🧹 Starting cleanup of migrated documentation files...\n');
  
  const files = readdirSync(ROOT_DIR);
  let deletedCount = 0;
  let freedSpace = 0;

  for (const filename of files) {
    const filePath = join(ROOT_DIR, filename);
    const stats = statSync(filePath);
    
    if (!stats.isFile() || !shouldDelete(filename)) {
      continue;
    }

    try {
      unlinkSync(filePath);
      console.log(`🗑️  Deleted: ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);
      deletedCount++;
      freedSpace += stats.size;
    } catch (error) {
      console.error(`❌ Failed to delete ${filename}:`, error);
    }
  }

  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   Deleted: ${deletedCount} files`);
  console.log(`   Space freed: ${(freedSpace / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n✅ Cleanup complete! Your deployment image will be much smaller.`);
}

cleanupDocs().catch(console.error);
