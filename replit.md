# HyperDAG Platform

## Overview

HyperDAG is a Web3-AI ecosystem platform that combines blockchain technology, artificial intelligence, and reputation systems. The platform provides decentralized identity management, AI-powered services, autonomous task orchestration, and multi-blockchain integration. It features a comprehensive authentication system supporting traditional OAuth, Web3 wallets, zero-knowledge proofs, and proof-of-life verification.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite for fast development and optimized production builds.

**UI Components**: Radix UI primitives for accessible, composable components with Tailwind CSS for styling. The design system uses CSS custom properties for theming with support for dark mode.

**Build Strategy**: Multiple build configurations exist (standard Vite, quick build with esbuild minification) optimized for different deployment scenarios. The production build outputs to `dist/public` while the server builds to `dist`.

**State Management**: Client-side state appears to use React hooks and context patterns based on the React dependencies and component structure.

**Routing**: Client-side routing integrated with server-side rendering capabilities during development via Vite middleware.

### Backend Architecture

**Runtime**: Node.js with TypeScript, using Express.js as the web framework.

**API Design**: RESTful API with routes organized in `server/routes.ts` and modular route handlers in `server/api`. The architecture supports both traditional REST endpoints and WebSocket connections for real-time features.

**Authentication System**: Multi-layered authentication supporting:
- Password-based authentication with bcrypt hashing
- OAuth providers (Google, Discord, GitHub, Twitter, LinkedIn, YouTube)
- Web3 wallet authentication with signature verification
- Two-factor authentication (TOTP)
- Proof-of-life biometric verification
- Session management with express-session and PostgreSQL session store

**Middleware Stack**: Comprehensive middleware including:
- CORS configuration for cross-origin requests
- Helmet for security headers
- Compression for response optimization
- Rate limiting for API protection
- Custom traffic safeguards and resilience measures
- CSRF protection
- Request validation and sanitization

**Service Layer**: Organized into specialized services:
- AI services (LangChain, OpenAI, Anthropic, Hugging Face integrations)
- Blockchain services (Polygon, Solana, IOTA, Stellar)
- Autonomous systems (problem detection, self-improvement, task orchestration)
- Trinity Symphony (distributed task coordination across managers)
- ZKP (zero-knowledge proof) services for privacy

**Background Processing**: Multiple autonomous systems run as background services:
- Problem detection and solving
- Metrics collection and analytics
- Cross-manager synchronization
- Resource arbitrage
- Agent task processing loops

### Data Storage Solutions

**Primary Database**: PostgreSQL accessed via Neon serverless driver with connection pooling. The database uses Drizzle ORM for type-safe queries and schema management.

**Schema Design**: Comprehensive schema in `shared/schema.ts` including:
- Users with multi-factor authentication fields
- Reputation and credential systems
- Project management and grants
- Notifications and analytics
- Blockchain wallet associations
- API keys and usage tracking

**Session Storage**: PostgreSQL-backed sessions using connect-pg-simple, storing session data in the database for persistence across server restarts.

**Migration Strategy**: Database migrations managed through Drizzle Kit with migration files in the `migrations` directory. Includes both automated migrations and manual SQL scripts for complex changes.

**Object Storage**: Integration with Google Cloud Storage (likely via Replit's object storage sidecar) for document and media storage.

**Caching Layer**: DragonflyDB (Redis-compatible) for distributed caching referenced in Trinity production configuration.

### Authentication and Authorization

**Multi-Factor Authentication**: Progressive authentication levels (1-4) where users can strengthen their security:
1. Password only
2. Password + TOTP 2FA
3. Password + 2FA + Wallet
4. All factors + Proof-of-Life

**Zero-Knowledge Proofs**: ZKP service for privacy-preserving credential verification without revealing underlying data. Supports identity commitments and proof generation/verification.

**Wallet Management**: Dual wallet system:
- User-provided Web3 wallets for user control
- Server-generated gasless wallets for subsidized transactions

**Session Security**: Secure session configuration with httpOnly cookies, configurable secure flag for production, and proper session regeneration on authentication state changes.

**Rate Limiting**: Multiple rate limit strategies including strict limits for authentication endpoints and general limits for API routes.

**CSRF Protection**: Token-based CSRF protection for state-changing operations.

### External Dependencies

**AI Providers**:
- OpenAI (GPT models)
- Anthropic (Claude models)
- Google AI (Gemini)
- Hugging Face (open models)
- Cohere
- LangChain for orchestration and LangGraph for agentic workflows

**Blockchain Networks**:
- Polygon zkEVM (Cardona testnet primary, mainnet support)
- Solana (testnet and mainnet)
- IOTA (Shimmer network)
- Stellar
- Optimism L2
- Ethereum (via Alchemy)
- Akash Network for decentralized computing

**Email Service**: Mailgun for transactional emails including verification codes, welcome emails, password resets.

**Communication**:
- Telegram Bot API for user verification and notifications
- WebSocket for real-time updates

**OAuth Providers**:
- Google (OAuth 2.0)
- GitHub (OAuth App)
- Discord (OAuth 2.0)
- Twitter/X (OAuth 2.0)
- LinkedIn (OAuth 2.0)
- YouTube (Google OAuth with YouTube scope)

**Infrastructure**:
- Railway for deployment (configuration in `railway.json`)
- Replit for development and hosting (multiple deployment configurations)
- Cloudflare for CDN and DNS management
- Zuplo API Gateway for unified routing

**Monitoring & Analytics**:
- Prometheus metrics collection
- Custom analytics event tracking
- Page view tracking
- API usage monitoring

**Development Tools**:
- Drizzle Kit for database migrations
- TSX for TypeScript execution
- Vite for frontend tooling
- ESBuild for server bundling

**Security & Cryptography**:
- OpenZeppelin contracts for blockchain standards
- Ethers.js for Ethereum interactions
- Account Abstraction (Alchemy AA) for gasless transactions
- Native crypto module for hashing and encryption

**Storage & Databases**:
- Neon serverless PostgreSQL
- Google Cloud Storage
- Supabase (referenced in Trinity coordination)
- DragonflyDB for caching