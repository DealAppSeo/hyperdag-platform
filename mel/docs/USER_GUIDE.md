# Mel User Guide

## Getting Started

After installing Mel, restart Geany and enable the plugin:

1. Open Geany
2. Go to **Tools** → **Plugin Manager**
3. Check **Mel** in the plugin list
4. Click **OK**

## Configuration

Edit your configuration file at `~/.config/mel/config.json`:

```json
{
    "ai_provider": "local",
    "features": {
        "auto_complete": true,
        "error_detection": true,
        "anticipatory_mode": true
    }
}
```

## AI Provider Setup

### OpenAI
1. Get an API key from https://platform.openai.com/
2. Add to config: `"providers.openai.api_key": "your-key"`

### Local Models
1. Download a compatible model
2. Set `"providers.local.model_path": "/path/to/model"`

## Features

### Auto-Completion
Mel provides intelligent code completion based on your patterns.

### Error Detection
Real-time error detection and suggestions for fixes.

### Learning Mode
Mel learns your coding style and adapts suggestions over time.

## Privacy

Mel respects your privacy:
- Local mode keeps all data on your machine
- No telemetry by default
- You control what data is shared