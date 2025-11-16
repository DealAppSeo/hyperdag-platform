# Contributing to Mel

Thank you for your interest in contributing to Mel! This document provides guidelines for contributing.

## Development Setup

1. Install dependencies:
```bash
sudo apt-get install build-essential geany libgtk-3-dev libgeany-dev libsqlite3-dev libcurl4-openssl-dev libjson-c-dev
```

2. Clone and build:
```bash
git clone https://github.com/dealappseo/mel.git
cd mel
make
```

3. Install for testing:
```bash
make install-user
```

## Code Style

- Use 4 spaces for indentation
- Follow GNU C coding standards
- Add comments for complex logic
- Keep functions focused and small

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Reporting Issues

Please use the GitHub issue tracker to report bugs or request features.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.