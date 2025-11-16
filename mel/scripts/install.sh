#!/bin/bash
# Universal installer script for Mel

set -e

REPO_URL="https://github.com/dealappseo/mel"
INSTALL_DIR="$HOME/.config/geany/plugins"
CONFIG_DIR="$HOME/.config/mel"

echo "🧠 Installing Mel - Adaptive AI Assistant for Geany"
echo "=================================================="

# Detect distribution
if command -v apt-get >/dev/null 2>&1; then
    DISTRO="debian"
elif command -v pacman >/dev/null 2>&1; then
    DISTRO="arch"
elif command -v dnf >/dev/null 2>&1; then
    DISTRO="fedora"
else
    echo "❌ Unsupported distribution. Please install manually."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
case $DISTRO in
    "debian")
        sudo apt-get update
        sudo apt-get install -y geany libgtk-3-0 libsqlite3-0 libcurl4 wget
        ;;
    "arch")
        sudo pacman -S --needed geany gtk3 sqlite curl wget
        ;;
    "fedora")
        sudo dnf install -y geany gtk3-devel sqlite-devel libcurl-devel wget
        ;;
esac

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"

# Download and install
echo "⬇️  Downloading Mel..."
LATEST_RELEASE=$(curl -s https://api.github.com/repos/dealappseo/mel/releases/latest | grep "tag_name" | cut -d '"' -f 4)

case $DISTRO in
    "debian")
        wget -O mel.deb "https://github.com/dealappseo/mel/releases/download/${LATEST_RELEASE}/mel_amd64.deb"
        sudo dpkg -i mel.deb
        rm mel.deb
        ;;
    *)
        # Build from source for other distributions
        echo "🔨 Building from source..."
        git clone $REPO_URL /tmp/mel
        cd /tmp/mel
        make
        cp mel.so "$INSTALL_DIR/"
        cp config/default_config.json "$CONFIG_DIR/config.json"
        cd - >/dev/null
        rm -rf /tmp/mel
        ;;
esac

echo "✅ Mel installed successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. Restart Geany"
echo "2. Go to Tools > Plugin Manager"
echo "3. Enable 'Mel' plugin"
echo "4. Configure your AI provider in $CONFIG_DIR/config.json"
echo ""
echo "📖 Documentation: https://github.com/dealappseo/mel"
echo "🌐 Website: https://melchizedekai.com"