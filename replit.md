# HyperDAG Platform

## Overview

HyperDAG is a distributed symbiotic AI optimization platform integrating Web3 infrastructure, AI orchestration, and nonprofit collaboration tools. Its core purpose is to provide autonomous AI optimization, combining multi-agent AI systems, blockchain technology, and grant discovery mechanisms. Key capabilities include the Trinity Symphony Framework for AI coordination, an Autonomous Decision-Making System for "No-Downside, Do-Now" problem-solving, and a comprehensive AI provider routing system. The platform aims for minimal deployment size and extensive free-tier optimization to achieve significant cost reductions in AI operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React 18 with Vite, TypeScript, and Tailwind CSS with shadcn/ui components. It features a mobile-first responsive design, component-based architecture, and optimized bundle size through code splitting.

### Backend Architecture

The backend is built with Node.js/Express and TypeScript. It employs a dual server configuration (minimal for landing page, full for API) and modular, feature-based route organization. Drizzle ORM is used for database interactions, and Express sessions handle session management.

### Data Storage Solutions

PostgreSQL serves as the primary relational database, utilizing Drizzle ORM for type-safe interactions and migrations. Replit Object Storage is used for offloading non-critical files and documentation to reduce deployment size. Session storage can be in-memory for development or Redis Cloud for production.

### Authentication & Authorization

Authentication methods include username/password, Telegram integration, and session-based authentication with secure cookie configuration. Security measures encompass CSRF token validation, rate limiting, bcrypt password hashing, and input validation. The authorization model is role-based, incorporating a RepID gamification system.

### AI Orchestration System

The Trinity Symphony Framework manages AI operations with three specialized managers (AI-Prompt-Manager, HyperDAGManager, Mel/ImageBearer), coordinating with a 0.09ms consensus time. It includes Veritas Enhancement for hallucination suppression through confidence scoring, adversarial checking, and abstention protocols. AI provider routing is ANFIS-based, optimizing for cost and free-tier maximization across providers like OpenAI, Anthropic, and Groq. The system also integrates mathematical optimization using harmonic mathematics, golden ratio principles, and chaos theory.

### Autonomous Decision-Making System

This system features a five-component architecture: Decision Engine, Problem Detector, Agentic Wrapper, Debate Protocol, and Auto-Fix Executor. It continuously monitors for performance degradation and errors, applying a "No-Downside Heuristic" to auto-implement fixes scoring 90+ without human approval.

### File Offloading System

A database-backed file storage system offloads non-runtime files to PostgreSQL, reducing deployment image size. API endpoints allow retrieval of these categorized files.

### Free Coding System

This system enables zero-cost autonomous coding by arbitrating across free-tier AI providers (e.g., HuggingFace, Groq, DeepSeek) using a Golden Ratio weighted rotation for optimal quota utilization.

## External Dependencies

### Cloud Services & Infrastructure

- **Deployment**: Replit (primary), Vercel, Railway, Render (alternatives)
- **Database**: PostgreSQL
- **Cache/Session**: Redis Cloud
- **Object Storage**: Replit Object Storage
- **Email**: Mailgun, SendGrid
- **CI/CD**: GitHub Actions
- **Automation**: n8n
- **Infrastructure**: Supabase

### AI & Web3 Services

- **AI Providers**: OpenAI, Anthropic, DeepSeek, MyNinja, Groq, Google Gemini
- **Blockchain**: Ethereum, Polygon, Solana
- **Decentralized Storage**: IPFS

### Third-Party APIs & Data Sources

- **Grant Discovery**: GitHub API, various web scraping targets
- **Communication**: Telegram Bot API

### Development & Build Tools

- **Frontend Build**: Vite
- **Backend Build**: esbuild
- **Language**: TypeScript
- **Package Management**: npm