/**
 * Dependency Analysis Script
 * Identifies unused and oversized dependencies
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

async function analyzeDependencies() {
  const packagePath = join(process.cwd(), 'package.json');
  const pkg: PackageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  
  console.log('📊 Dependency Analysis\n');
  
  // Count dependencies
  const deps = Object.keys(pkg.dependencies || {});
  const devDeps = Object.keys(pkg.devDependencies || {});
  
  console.log(`Total dependencies: ${deps.length}`);
  console.log(`Total devDependencies: ${devDeps.length}`);
  console.log(`Total packages: ${deps.length + devDeps.length}\n`);
  
  // Identify potential duplicates and heavy packages
  const heavy = [
    '@langchain/langgraph',
    'langchain',
    'torch',
    'drizzle-kit',
    'esbuild',
    'vite',
    '@types/node',
  ];
  
  const potentiallyUnused = [
    'n8n',
    'discord.js',
    'node-telegram-bot-api',
    'telegraf',
    'tone',
    'canvas',
    'html2canvas',
    'qiskit',
    'snarkjs',
    'vast-client',
  ];
  
  console.log('🔍 Heavy packages found:');
  heavy.forEach(pkg => {
    if (deps.includes(pkg) || devDeps.includes(pkg)) {
      console.log(`  - ${pkg}`);
    }
  });
  
  console.log('\n⚠️  Potentially unused packages:');
  potentiallyUnused.forEach(pkg => {
    if (deps.includes(pkg) || devDeps.includes(pkg)) {
      console.log(`  - ${pkg}`);
    }
  });
  
  console.log('\n💡 Recommendations:');
  console.log('1. Move devDependencies to devDependencies section (not deployed)');
  console.log('2. Remove unused packages with: npm uninstall <package>');
  console.log('3. Use dynamic imports for heavy packages only used occasionally');
  console.log('4. Consider replacing heavy packages with lighter alternatives\n');
}

analyzeDependencies();
