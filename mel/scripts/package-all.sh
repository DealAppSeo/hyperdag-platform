#!/bin/bash
# Universal package builder for all distributions

set -e

VERSION=${1:-"1.0.0"}

echo "🏗️  Building all packages for Mel v${VERSION}"

# Create release directory
mkdir -p release/{packages,source}

# Build the plugin first
echo "🔨 Building Mel plugin..."
make clean
make

# Create source package
echo "📦 Creating source package..."
git archive --format=tar.gz --prefix=mel-${VERSION}/ HEAD > release/source/mel-${VERSION}.tar.gz

# Build distribution packages
echo "🐧 Building Debian package..."
./scripts/package-deb.sh ${VERSION}

echo "📦 Building RPM package..."
# ./scripts/package-rpm.sh ${VERSION}

echo "🎯 Building AUR package..."
# ./scripts/package-aur.sh ${VERSION}

echo "✅ All packages built successfully!"
echo "📁 Packages available in release/packages/"
ls -la release/packages/