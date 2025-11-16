# Configuration Guide

## Configuration File Location

- **User config**: `~/.config/mel/config.json`
- **System config**: `/etc/mel/config.json`

## Configuration Options

### AI Providers

```json
{
    "ai_provider": "openai",
    "providers": {
        "openai": {
            "api_key": "your-api-key",
            "model": "gpt-3.5-turbo",
            "max_tokens": 1000
        },
        "anthropic": {
            "api_key": "your-api-key", 
            "model": "claude-3-haiku-20240307"
        },
        "local": {
            "enabled": true,
            "model_path": "/path/to/local/model",
            "use_gpu": false
        }
    }
}
```

### Features

```json
{
    "features": {
        "auto_complete": true,
        "error_detection": true,
        "code_explanation": true,
        "anticipatory_mode": true,
        "learning_enabled": true
    }
}
```

### Privacy Settings

```json
{
    "privacy": {
        "telemetry": false,
        "local_only": true,
        "store_history": false
    }
}
```

## Environment Variables

- `MEL_CONFIG_PATH`: Override config file location
- `MEL_LOG_LEVEL`: Set logging level (debug, info, warn, error)