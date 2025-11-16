<div align="center">

<img src="docs/assets/mel-logo.png" alt="Mel Logo" width="120"/>

# Mel - Adaptive AI Assistant for Geany

[![GitHub Release](https://img.shields.io/github/v/release/dealappseo/mel?include_prereleases)](https://github.com/dealappseo/mel/releases)
[![CI Build](https://github.com/dealappseo/mel/workflows/Build%20and%20Test/badge.svg)](https://github.com/dealappseo/mel/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Geany: 1.38+](https://img.shields.io/badge/Geany-1.38%2B-brightgreen)](https://www.geany.org/)
[![Website](https://img.shields.io/badge/Website-melchizedekai.com-blue)](https://melchizedekai.com)

**🧠 The AI assistant that learns how YOU code**

[Features](#-features) • [Install](#-installation) • [Demo](#-demo) • [Docs](docs/) • [Contributing](#-contributing)

</div>

---

## ✨ Features

Mel is an adaptive AI assistant that goes beyond traditional code completion:

- 🧠 **Learns Your Patterns** - Adapts to your coding style and preferences
- 🔮 **Anticipates Needs** - Offers help before you ask based on context
- 🔒 **Privacy First** - Works completely offline with local AI models
- 🚀 **Multi-Provider** - Supports OpenAI, Anthropic, Google, and local models
- 📈 **Grows With You** - Becomes more helpful over time

## 🚀 Installation

### Quick Install
```bash
curl -sSL https://melchizedekai.com/install.sh | bash
```

### Platform Specific

**Ubuntu/Debian:**
```bash
wget https://github.com/dealappseo/mel/releases/latest/download/mel_amd64.deb
sudo dpkg -i mel_amd64.deb
```

**Arch Linux:**
```bash
yay -S geany-plugin-mel
```

**Build from Source:**
```bash
git clone https://github.com/dealappseo/mel.git
cd mel
./autogen.sh
./configure
make
sudo make install
```

## 🎥 Demo

![Mel Demo](docs/assets/mel-demo.gif)

*Mel learning your coding patterns and providing personalized suggestions*

## 📖 Documentation

- [User Guide](docs/USER_GUIDE.md)
- [Configuration](docs/CONFIGURATION.md)
- [AI Providers Setup](docs/PROVIDERS.md)
- [API Reference](docs/API.md)
- [FAQ](docs/FAQ.md)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- 🌐 [Website](https://melchizedekai.com)
- 💬 [Discord Community](https://discord.gg/mel)
- 🐛 [Issue Tracker](https://github.com/dealappseo/mel/issues)
- 📧 [Contact](mailto:support@melchizedekai.com)

---

<div align="center">
Built with ❤️ for the Geany community
</div>