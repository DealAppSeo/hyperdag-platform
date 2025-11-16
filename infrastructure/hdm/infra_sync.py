#!/usr/bin/env python3
"""
HyperDAGManager Infrastructure Sync Script
Safely sync infrastructure changes to GitHub with security checks
"""

import subprocess
import sys
import re
from datetime import datetime
from pathlib import Path

# Dangerous patterns that might indicate secrets
DANGEROUS_PATTERNS = [
    r'password\s*=\s*["\'][^"\']+["\']',
    r'api_key\s*=\s*["\'][^"\']+["\']',
    r'secret\s*=\s*["\'][^"\']+["\']',
    r'token\s*=\s*["\'][^"\']+["\']',
    r'ghp_[a-zA-Z0-9]{36}',  # GitHub Personal Access Token
    r'sk-[a-zA-Z0-9]{20,}',  # OpenAI/similar API keys
    r'-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----',  # Private keys
    r'postgres://[^:]+:[^@]+@',  # Database URLs with credentials
    r'redis://:[^@]+@',  # Redis URLs with passwords
    r'AKIA[0-9A-Z]{16}',  # AWS Access Key
]

# Allowed patterns (false positives we want to ignore)
ALLOWED_PATTERNS = [
    r'\.example',  # .env.example files
    r'PLACEHOLDER',
    r'your_.*_here',
    r'xxxxx',
    r'sk-\.\.\.',  # Truncated examples
]


def run_command(cmd, check=True, capture=True):
    """Run shell command and return output"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=capture,
            text=True,
            check=check,
            shell=isinstance(cmd, str)
        )
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
        print(f"Error: {e}")
        return None


def is_allowed_pattern(text):
    """Check if text matches allowed patterns (false positives)"""
    for pattern in ALLOWED_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def check_secrets():
    """Verify no secrets in staged changes"""
    print("🔍 Scanning for secrets in staged changes...")
    
    result = run_command(['git', 'diff', '--cached'])
    if not result:
        return False
    
    diff_content = result.stdout
    lines = diff_content.split('\n')
    
    secrets_found = []
    
    for i, line in enumerate(lines, 1):
        # Skip removed lines and file markers
        if line.startswith('-') or line.startswith('@@') or line.startswith('---') or line.startswith('+++'):
            continue
            
        # Check against dangerous patterns
        for pattern in DANGEROUS_PATTERNS:
            matches = re.finditer(pattern, line, re.IGNORECASE)
            for match in matches:
                matched_text = match.group()
                # Skip if it's an allowed pattern
                if not is_allowed_pattern(matched_text):
                    secrets_found.append({
                        'line': i,
                        'pattern': pattern,
                        'text': matched_text[:50] + '...' if len(matched_text) > 50 else matched_text
                    })
    
    if secrets_found:
        print("🚨 DANGER: Potential secrets detected!")
        print("\nFound suspicious patterns:")
        for secret in secrets_found[:5]:  # Show first 5
            print(f"  Line {secret['line']}: {secret['text']}")
        print("\n⚠️  If these are real secrets:")
        print("  1. Add them to .gitignore")
        print("  2. Run: git reset")
        print("  3. Re-stage without secrets")
        print("  4. Run this script again")
        return False
    
    print("✅ No secrets detected in staged changes")
    return True


def check_git_status():
    """Check if there are changes to commit"""
    result = run_command(['git', 'status', '--porcelain'])
    if not result:
        return None
    
    if not result.stdout.strip():
        print("ℹ️  No infrastructure changes to sync")
        return None
    
    print(f"📝 Changes detected:\n{result.stdout}")
    return result.stdout


def sync_infrastructure(auto_push=False):
    """Sync infrastructure changes to GitHub"""
    print("=" * 60)
    print("🌐 HyperDAGManager Infrastructure Sync")
    print("=" * 60)
    
    # Check for changes
    status = check_git_status()
    if status is None:
        return True
    
    # Stage infrastructure changes
    print("\n📦 Staging infrastructure files...")
    stage_result = run_command(['git', 'add', 'infrastructure/hdm/', '.gitignore'])
    if not stage_result:
        return False
    
    # Security check
    if not check_secrets():
        print("\n🔄 Resetting staged changes for safety...")
        run_command(['git', 'reset'], check=False)
        return False
    
    # Show what will be committed
    print("\n📋 Files to be committed:")
    run_command(['git', 'status', '--short'])
    
    # Commit
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    commit_msg = f"HDM: Infrastructure update at {timestamp}"
    
    print(f"\n💾 Committing with message: '{commit_msg}'")
    commit_result = run_command(['git', 'commit', '-m', commit_msg])
    if not commit_result:
        return False
    
    print("✅ Committed successfully")
    
    # Show commit details
    print("\n📊 Commit details:")
    run_command(['git', 'log', '-1', '--stat'])
    
    # Push (if auto_push enabled)
    if auto_push:
        print("\n🚀 Pushing to GitHub...")
        push_result = run_command(['git', 'push'])
        if not push_result:
            print("⚠️  Push failed. You can manually push with: git push")
            return False
        print("✅ Pushed to GitHub successfully")
    else:
        print("\n⏸️  Auto-push disabled. To push to GitHub, run:")
        print("   git push")
    
    print(f"\n🎉 Infrastructure synced at {timestamp}")
    return True


def verify_export():
    """Verify the export is complete and valid"""
    print("\n🔍 Verifying export...")
    
    required_files = [
        'infrastructure/hdm/docs/README.md',
        'infrastructure/hdm/HDM-MANIFEST.md',
        'infrastructure/hdm/.env.example',
        'infrastructure/hdm/networking/API_ROUTES.md',
        'infrastructure/hdm/server/index.ts',
        'infrastructure/hdm/server/vite.ts',
    ]
    
    missing = []
    for file in required_files:
        if not Path(file).exists():
            missing.append(file)
    
    if missing:
        print("❌ Missing required files:")
        for file in missing:
            print(f"   - {file}")
        return False
    
    print("✅ All required files present")
    
    # Count exported files
    result = run_command(['find', 'infrastructure/hdm', '-type', 'f'])
    if result:
        file_count = len(result.stdout.strip().split('\n'))
        print(f"✅ Total files exported: {file_count}")
    
    return True


def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Sync HyperDAGManager infrastructure to GitHub'
    )
    parser.add_argument(
        '--push',
        action='store_true',
        help='Automatically push to GitHub after commit'
    )
    parser.add_argument(
        '--verify',
        action='store_true',
        help='Only verify export completeness, do not sync'
    )
    
    args = parser.parse_args()
    
    if args.verify:
        success = verify_export()
    else:
        success = sync_infrastructure(auto_push=args.push)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
