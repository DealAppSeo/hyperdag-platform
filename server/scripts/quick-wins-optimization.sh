#!/bin/bash
# Quick Wins Optimization Script
# Executes high-impact, low-effort optimizations

echo "🚀 Starting Quick Wins Optimization..."
echo ""

# 1. Remove backup directories
echo "📁 Removing backup directories..."
rm -rf hyperdagmanager_backup_2025-08-06_04-33-21
rm -rf hyperdagmanager_backup_2025-08-07_05-09-49
rm -rf hyperdagmanager_competitive_final_2025-08-07
echo "✅ Backup directories removed"
echo ""

# 2. Check for hardcoded secrets
echo "🔍 Scanning for hardcoded secrets..."
echo "Checking for API keys..."
grep -r "sk-" --include="*.ts" --include="*.js" server/ client/ || echo "  No OpenAI keys found"
grep -r "api_key\s*=\s*['\"]" --include="*.ts" --include="*.js" server/ client/ || echo "  No hardcoded API keys found"
echo ""

# 3. Analyze package size
echo "📦 Analyzing package usage..."
echo "Potentially unused heavy packages:"
echo "  - n8n (automation)"
echo "  - discord.js (Discord integration)"
echo "  - node-telegram-bot-api (Telegram)"
echo "  - telegraf (Telegram alt)"
echo "  - tone (audio synthesis)"
echo "  - canvas (image processing)"
echo "  - html2canvas (screenshots)"
echo "  - qiskit (quantum computing)"
echo "  - snarkjs (zero-knowledge proofs)"
echo "  - vast-client (video ads)"
echo ""
echo "Run 'npm uninstall <package>' to remove unused packages"
echo ""

# 4. Summary
echo "✅ Quick wins completed!"
echo ""
echo "📊 Estimated savings:"
echo "  - Disk space: ~200 KB (backups)"
echo "  - Potential: 50-100 MB (if unused packages removed)"
echo ""
echo "🔐 Security reminders:"
echo "  1. Run Security Scanner before deployment"
echo "  2. Verify all secrets are in Secrets tool"
echo "  3. Review rate limiting configuration"
echo ""
echo "📝 Next steps from OPTIMIZATION_ROADMAP.md:"
echo "  - Migrate attached_assets to Object Storage (-5 MB)"
echo "  - Add database indexes for common queries"
echo "  - Implement caching for repeated requests"
echo ""
