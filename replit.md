# Swapchat - Blockchain Messaging Platform

## Overview

Swapchat is a secure messaging application that uses blockchain technology to store and transmit messages. Unlike traditional messaging platforms, each message is stored as a block in an immutable blockchain, providing cryptographic verification and tamper-proof message history. The application combines end-to-end encryption with blockchain's inherent security to create a transparent, auditable messaging system.

The platform features a WhatsApp-like user interface with a unique "Swapchat" design theme, real-time communication via WebSockets, and a complete blockchain ledger viewer for auditing message history.

## Replit Setup

### Initial Setup Complete (October 3, 2025)

The project has been successfully configured to run in the Replit environment:

1. **Development Workflow**: Configured to run `npm run dev` on port 5000 with webview output
2. **Database**: PostgreSQL database has been created and schema pushed successfully
3. **Vite Configuration**: Already configured with `allowedHosts: true` for Replit proxy compatibility
4. **Server Configuration**: Express server binds to `0.0.0.0:5000` for frontend access
5. **Deployment**: Configured for autoscale deployment with build and start scripts

### Required Environment Secrets

The following secrets need to be added in Replit's Secrets panel for full functionality:

- `DATABASE_URL` ✓ (Already configured)
- `JWT_SECRET` - Secret key for JWT signing (required for authentication)
- `ENCRYPTION_MASTER_KEY` - Master key for field encryption (minimum 32 characters, required for data encryption)
- `EMAIL_SERVICE` - SMTP service provider (e.g., "gmail") (optional for email features)
- `EMAIL_USER` - Email sender address (optional for email features)
- `EMAIL_PASSWORD` - Email account password (optional for email features)

Note: The application can run without email configuration, but OTP verification features will not work.

### Running the Project

- **Development**: The workflow "Start application" runs automatically and starts the dev server
- **Manual Start**: Use `npm run dev` to start the development server
- **Build**: Use `npm run build` to create a production build
- **Production**: Use `npm run start` to run the production server
- **Database Schema**: Use `npm run db:push` to sync schema changes to the database

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite for fast development and optimized production builds.

**UI Components**: The application uses shadcn/ui components built on Radix UI primitives, providing accessible and customizable interface elements. All components follow a consistent design system with dark mode as the primary theme.

**Styling**: TailwindCSS with custom configuration for the Swapchat brand identity. The design system uses HSL color values with CSS variables for theming, featuring:
- Dark gradient backgrounds (midnight blue tones)
- Primary "Swapgreen" color for CTAs and active states
- Coral accent for system messages
- Chain Blue for blockchain indicators

**State Management**: TanStack Query (React Query) for server state management, with custom query client configuration. Local component state uses React hooks.

**Routing**: Wouter for lightweight client-side routing with main routes for home, login, and 404 pages.

**Key Design Patterns**:
- Component composition with reusable UI primitives
- Separation of concerns between presentation and logic
- Custom hooks for shared functionality (mobile detection, toast notifications)
- Path aliases for clean imports (@/, @shared/, @assets/)

### Backend Architecture

**Runtime**: Node.js with Express.js server framework.

**Real-time Communication**: Socket.IO for bidirectional WebSocket communication, enabling instant message delivery with authentication middleware.

**API Structure**: RESTful API with three main route groups:
- `/api/auth`: Authentication, registration, OTP verification, IP authorization
- `/api/users`: User profiles, contacts list
- `/api/blockchain`: Blockchain ledger access and validation

**Security Layers**:
- Helmet.js for HTTP security headers
- CORS configuration for cross-origin requests
- Rate limiting (100 requests per 15 minutes per IP)
- Cookie-based session management
- JWT tokens for stateless authentication

**Encryption Strategy** (Double-layer security):
1. Client-side end-to-end encryption using NaCl (TweetNaCl):
   - Private keys are generated on the client and NEVER transmitted to the server
   - Private keys are stored ONLY in browser localStorage
   - Only public keys are sent to and stored on the server
   - Messages are encrypted with recipient's public key before transmission
2. Server-side field encryption using AES with master key for stored data
3. Bcrypt password hashing with 12 rounds

**Blockchain Implementation**:
- Custom lightweight blockchain (not a distributed ledger)
- Each message stored as a block with: index, timestamp, from, to, payload, prevHash, hash
- SHA-256 hashing for block integrity
- Genesis block initialization
- Chain validation capabilities

### Data Storage

**Database**: PostgreSQL via Neon serverless (with WebSocket support for serverless environments).

**ORM**: Drizzle ORM with schema-first approach, providing type-safe database operations.

**Schema Design**:
- `users`: Stores user credentials, cryptographic keys, authorized IPs, verification status
- `blocks`: Blockchain storage with encrypted message payloads
- `otps`: One-time passwords for email verification (auto-expiring)
- `ipAuthorizations`: IP-based access control with token verification

**Data Encryption**: Sensitive fields (username, email, phone, private keys, message content) are encrypted at rest using AES-GCM with a master encryption key.

**Key Management**: 
- Each user has a public/private NaCl key pair for message encryption
- Private keys are generated on client-side during registration and stored ONLY in browser localStorage
- Private keys NEVER leave the client or get transmitted to the server
- Only public keys are stored on the server (in encrypted form)
- True end-to-end encryption: server cannot decrypt any messages

### Authentication & Authorization

**Multi-factor Authentication Flow**:
1. Email/OTP verification during registration
2. IP-based authorization with email confirmation for new devices
3. JWT tokens with username/userId claims
4. Cookie and header-based token transmission

**Security Features**:
- Password strength requirements via validation
- IP whitelist per user account
- Token expiration and refresh mechanism
- Socket authentication for real-time features

**User Registration Process**:
1. Username availability check
2. Email OTP generation and verification
3. Cryptographic key pair generation
4. IP authorization for first device
5. Account creation with encrypted credentials

## External Dependencies

### Third-party Services

**Email Service**: Nodemailer with configurable SMTP provider (Gmail by default) for:
- OTP delivery during registration
- IP authorization notifications
- Security alerts

**hCaptcha**: Client-side bot prevention during authentication flows.

### Database & Infrastructure

**Neon Database**: Serverless PostgreSQL with WebSocket constructor for compatibility with serverless environments.

**Environment Variables Required**:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing
- `ENCRYPTION_MASTER_KEY`: Master key for field encryption (minimum 32 characters)
- `EMAIL_SERVICE`: SMTP service provider
- `EMAIL_USER`: Email sender address
- `EMAIL_PASSWORD`: Email account password
- `REPLIT_DEV_DOMAIN`: Development domain for CORS

### Key Libraries

**Cryptography**:
- `crypto-js`: AES encryption for messages and fields
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT token generation and verification

**UI Framework**:
- `@radix-ui/*`: Headless UI components (20+ components)
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Component variant management
- `lucide-react`: Icon library

**Development Tools**:
- `drizzle-kit`: Database migrations and schema management
- `vite`: Build tool and dev server
- `esbuild`: Server-side bundling for production

**Validation**:
- `zod`: Schema validation
- `@hookform/resolvers`: Form validation integration
- `express-validator`: API input validation