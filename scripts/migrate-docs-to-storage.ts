// Documentation Migration Script
// Moves all *.md and *.json documentation files to Object Storage
// and stores metadata in PostgreSQL

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { Storage } from '@google-cloud/storage';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

// Initialize Object Storage Client
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

// Extract bucket name from the full bucket ID path
const bucketIdPath = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || '';
const BUCKET_NAME = bucketIdPath.includes('/') 
  ? bucketIdPath.split('/').pop() || '' 
  : bucketIdPath;
const ROOT_DIR = process.cwd();

// Categories of files to migrate
const FILE_PATTERNS = {
  REPORTS: /_REPORT\.md$/i,
  GUIDES: /_GUIDE\.md$/i,
  STATUS: /_STATUS\.md$/i,
  DEPLOYMENT: /_DEPLOYMENT.*\.md$/i,
  VALIDATION: /_VALIDATION.*\.md$/i,
  VERIFICATION: /_VERIFICATION.*\.md$/i,
  ANALYSIS: /_ANALYSIS\.md$/i,
  COMPLETE: /_COMPLETE\.md$/i,
  LOGS: /verification_log\.json$/i,
  PATENT: /^PATENT_.*\.md$/i,
  OTHER_MD: /\.md$/i,
  JSON_RESULTS: /_results?\.json$/i,
};

function categorizeFile(filename: string): string {
  for (const [category, pattern] of Object.entries(FILE_PATTERNS)) {
    if (pattern.test(filename)) {
      return category.toLowerCase();
    }
  }
  return 'other';
}

function shouldMigrate(filename: string): boolean {
  // Keep README.md, package.json, tsconfig.json locally
  const keepLocal = ['README.md', 'package.json', 'package-lock.json', 'tsconfig.json', 'drizzle.config.ts'];
  if (keepLocal.includes(filename)) return false;
  
  // Migrate all .md and .json files except critical ones
  return filename.endsWith('.md') || filename.endsWith('.json');
}

async function migrateDocumentation() {
  console.log('📚 Starting documentation migration to Object Storage...\n');
  
  const bucket = objectStorageClient.bucket(BUCKET_NAME);
  const files = readdirSync(ROOT_DIR);
  
  let migratedCount = 0;
  let skippedCount = 0;
  let totalSize = 0;

  for (const filename of files) {
    const filePath = join(ROOT_DIR, filename);
    const stats = statSync(filePath);
    
    if (!stats.isFile() || !shouldMigrate(filename)) {
      skippedCount++;
      continue;
    }

    try {
      // Read file content
      const content = readFileSync(filePath, 'utf-8');
      const category = categorizeFile(filename);
      
      // Upload to Object Storage
      const objectPath = `docs/${category}/${filename}`;
      const file = bucket.file(objectPath);
      
      await file.save(content, {
        contentType: filename.endsWith('.md') ? 'text/markdown' : 'application/json',
        metadata: {
          originalPath: filePath,
          category,
          migratedAt: new Date().toISOString(),
        }
      });

      // Store metadata in PostgreSQL
      await db.execute(sql`
        INSERT INTO documentation_storage (filename, category, content, file_size)
        VALUES (${filename}, ${category}, ${content}, ${stats.size})
        ON CONFLICT (filename) DO UPDATE SET
          content = ${content},
          category = ${category},
          file_size = ${stats.size},
          updated_at = NOW()
      `);

      console.log(`✅ Migrated: ${filename} (${(stats.size / 1024).toFixed(2)} KB) → ${objectPath}`);
      migratedCount++;
      totalSize += stats.size;
      
    } catch (error) {
      console.error(`❌ Failed to migrate ${filename}:`, error);
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Migrated: ${migratedCount} files`);
  console.log(`   Skipped: ${skippedCount} files`);
  console.log(`   Total size saved: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n✅ Documentation migration complete!`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review migrated files in Object Storage tool`);
  console.log(`   2. Delete local copies with: npm run cleanup-docs`);
  console.log(`   3. Deploy with reduced image size`);
}

migrateDocumentation().catch(console.error);
