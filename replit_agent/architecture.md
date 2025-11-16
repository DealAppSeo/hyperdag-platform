# HyperDAG Architecture

## 1. Overview

HyperDAG is a mobile-first, AI-enhanced Web3 collaborative ecosystem designed to create synergy and opportunity in professional networking. The platform combines blockchain technology with directed acyclic graph (DAG) structures to create a decentralized, scalable system for professional collaboration, crowdfunding, and reputation management.

Key features include:
- HyperCrowd decentralized crowdfunding
- Dynamic reputation system (RepID)
- Four-factor authentication (4FA)
- Bacalhau distributed computing integration
- Zero-knowledge proofs for privacy protection

## 2. System Architecture

HyperDAG follows a monorepo structure with a clear separation between client, server, and shared code. The architecture employs a modern full-stack JavaScript/TypeScript approach with React for the frontend and Express.js for the backend.

### High-Level Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  React      │    │  Express.js │    │  PostgreSQL │
│  Frontend   │◄───┤  Backend    │◄───┤  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                  ▲                  ▲
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                 ┌────────┴────────┐
                 │  Blockchain     │
                 │  Integration    │
                 └─────────────────┘
                          ▲
                          │
         ┌────────────────┼────────────────┐
         │                │                │
┌────────▼─────┐  ┌───────▼────────┐ ┌─────▼──────┐
│  Polygon     │  │  Bacalhau      │ │  External  │
│  CDK Chain   │  │  Compute       │ │  Services  │
└──────────────┘  └────────────────┘ └────────────┘
```

### Directory Structure

- `/client`: React frontend application
- `/server`: Express.js backend server
- `/shared`: Shared code between client and server (schemas, types)
- `/types`: TypeScript type definitions
- `/migrations`: Database migration files

## 3. Key Components

### 3.1 Frontend

**Technology Stack:**
- React with TypeScript
- Vite as the build tool
- Tailwind CSS for styling
- Shadcn UI components (via Radix UI)
- Web3 integration via MetaMask SDK

The frontend is built as a SPA (Single Page Application) with client-side routing. It's optimized for mobile-first interactions and implements the Shadcn UI component system for a consistent design language.

### 3.2 Backend

**Technology Stack:**
- Express.js with TypeScript
- Node.js runtime environment
- RESTful API architecture
- Session-based authentication with Passport.js
- JWT for API authentication

The backend serves both API endpoints and the compiled frontend. It implements a modular architecture with dedicated services for different functionalities (authentication, blockchain, reputation, etc.).

### 3.3 Database

**Technology Stack:**
- PostgreSQL database
- Drizzle ORM
- Neon Serverless PostgreSQL client

The database schema defines the following key entities:
- Users
- Badges
- Referrals
- Projects
- RFPs (Request for Proposals)
- RFIs (Request for Information)
- Grant Sources
- Grant Matches
- Reputation Activities
- Verified Credentials

### 3.4 Blockchain Integration

**Technology Stack:**
- Polygon CDK (Customizable Development Kit)
- Plonky3 validator for zero-knowledge proofs
- Web3.js/Ethers.js for blockchain interaction
- Smart contracts (via OpenZeppelin contracts)

The blockchain integration enables:
- On-chain identity management
- Decentralized crowdfunding via the HyperCrowd contract
- Reputation verification with zero-knowledge proofs
- Integration with external blockchain services via Moralis

### 3.5 AI and Compute Integration

**Technology Stack:**
- Perplexity AI for project recommendations
- Anthropic/Claude SDK for AI assistance
- Bacalhau distributed computing network
- OpenAI as a fallback service

These integrations allow for:
- AI-powered project recommendations
- Team matching based on reputation and skills
- Distributed computing tasks via Bacalhau
- Enhanced content generation and analysis

## 4. Data Flow

### 4.1 Authentication Flow

1. User registers/logs in via username/password, Web3 wallet, or external provider
2. Backend validates credentials and establishes a session
3. Multi-factor verification occurs if enabled (email, TOTP, wallet signature)
4. User receives a session token for subsequent API requests
5. Session is maintained with secure, HTTP-only cookies

### 4.2 Project Creation and Funding Flow

1. User creates a Request for Information (RFI)
2. Community votes on RFIs
3. RFIs with enough votes are converted to Requests for Proposals (RFPs)
4. Teams submit proposals for RFPs
5. Funding occurs through grant matching from various sources
6. Projects are managed through on-chain contracts and off-chain tracking

### 4.3 Reputation System Flow

1. Users earn reputation points through various activities
2. Reputation is verified through zero-knowledge proofs to preserve privacy
3. Verified credentials enhance reputation score
4. AI-based matching uses reputation scores for team formation
5. Reputation influences grant matching and proposal acceptance

## 5. External Dependencies

### 5.1 Blockchain Services

- **Polygon CDK**: Customizable blockchain infrastructure
- **Moralis**: Blockchain data indexing and API access
- **MetaMask SDK**: Wallet integration for authentication and transactions

### 5.2 AI and Compute Services

- **Perplexity AI**: Primary AI service for recommendations
- **Anthropic Claude**: Conversational AI assistance
- **OpenAI**: Fallback AI service
- **Bacalhau**: Distributed computing network for ML and data processing

### 5.3 Communication Services

- **SendGrid**: Email service for notifications and verification
- **Twilio**: SMS service for 2FA and alerts
- **Telegram API**: Integration for bot interactions
- **Slack API**: Team communications and notifications

### 5.4 Development and Deployment

- **Replit**: Development environment configuration
- **Neon Database**: Serverless PostgreSQL provider
- **Vite**: Frontend build tool with HMR support

## 6. Security Architecture

### 6.1 Authentication System

The platform implements a four-factor authentication system:
1. Knowledge factor: Username/password
2. Email verification
3. Time-based OTP
4. Wallet signature verification

### 6.2 API Security

- CSRF protection for authenticated routes
- Rate limiting for sensitive endpoints
- Helmet.js for security headers
- API key authentication for programmatic access
- Scoped permissions for API access

### 6.3 Privacy Features

- Zero-knowledge proofs for privacy-preserving identity and reputation
- Selective disclosure of credentials
- Configurable profile visibility settings
- Encryption for sensitive data

## 7. Deployment Strategy

The application is configured for deployment on various platforms with a focus on containerization and autoscaling:

- Development: Local development with hot-reloading via Vite
- Production: Compiled build with optimized assets
- Database: Neon Serverless PostgreSQL
- Build process: 
  1. Frontend compilation with Vite
  2. Backend bundling with esbuild
  3. Combined serving from single Express app

The deployment targets can include:
- Replit (as configured in `.replit`)
- Container-based platforms (via autoscaling configuration)
- Traditional VPS or cloud hosting

## 8. Future Architectural Considerations

### 8.1 Scalability

- Implementing microservices for better isolation of concerns
- Enhancing database scalability with horizontal partitioning
- Offloading heavy compute tasks to Bacalhau network

### 8.2 Integration Expansion

- Additional blockchain networks beyond Polygon
- More sophisticated AI models for recommendation
- Enhanced ZK-proof capabilities for privacy

### 8.3 Performance Optimization

- GraphQL API for more efficient data fetching
- Edge caching for frequently accessed data
- Optimistic UI updates for real-time interactions