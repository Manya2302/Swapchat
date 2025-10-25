# Swapchat - Blockchain Messaging Platform

## Overview

Swapchat is a secure messaging application that uses blockchain technology to store and transmit messages. Unlike traditional messaging platforms, each message is stored as a block in an immutable blockchain, providing cryptographic verification and tamper-proof message history. The application combines end-to-end encryption with blockchain's inherent security to create a transparent, auditable messaging system.

The platform features a WhatsApp-like user interface with a unique "Swapchat" design theme, real-time communication via WebSockets, and a complete blockchain ledger viewer for auditing message history.

## Replit Setup

### GitHub Import Setup (October 4, 2025)

**Project successfully imported and configured for Replit:**

The project has been configured to run in the Replit environment with MongoDB:

1. ✓ **MongoDB Database**: MongoDB 7.0.16 running locally on localhost:27017 with data stored in /home/runner/workspace/data/db
2. ✓ **Workflows Configured**: 
   - "MongoDB Server" workflow runs the MongoDB server in the background (console output)
   - "Start application" workflow runs `npm run dev` on port 5000 (webview output)
3. ✓ **Vite Configuration**: Already configured with `allowedHosts: true` for Replit proxy compatibility (server/vite.ts line 26)
4. ✓ **Server Configuration**: Express server binds to `0.0.0.0:5000` for frontend access, backend on localhost
5. ✓ **Code Cleanup**: Unused TypeScript/Drizzle/PostgreSQL files renamed to *.bak to prevent compilation errors
6. ✓ **Application Running**: Server started successfully with blockchain initialized
7. ✓ **Environment Configuration**: Using local MongoDB at mongodb://localhost:27017/swapchat
8. ✓ **Deployment Configured**: VM deployment with MongoDB and application server running together

**Technical Notes:**
- The project had duplicate implementations (MongoDB/Mongoose .js files and PostgreSQL/Drizzle .ts files)
- Only the MongoDB/Mongoose implementation is active and being used
- Unused TypeScript files (.ts) were renamed to *.bak to prevent compilation errors during tsx execution
- The server entry point (server/index.ts) loads server/index-main.ts which uses the .js route files
- MongoDB data directory: /home/runner/workspace/data/db
- Genesis block automatically created on first run
- Dependencies installed via npm, all packages up to date

### Environment Variables

Required environment variables (currently using development defaults):

**Database:**
- `MONGODB_URI` - MongoDB connection string (defaults to `mongodb://localhost:27017/swapchat`)

**Security (should be configured in Secrets for production):**
- `JWT_SECRET` - Secret key for JWT token signing (min 32 chars recommended)
- `ENCRYPTION_MASTER_KEY` - Master key for AES field encryption (min 32 chars required)
- `HCAPTCHA_SECRET_KEY` - Secret for hCaptcha verification (defaults to test key `0x0000000000000000000000000000000000000000`)

**Email (configured for OTP verification):**
- `EMAIL_SERVICE` - SMTP service provider (✓ configured)
- `EMAIL_USER` - Email sender address (✓ configured)
- `EMAIL_PASSWORD` - Email account password/app password (✓ configured)

**Note**: Email credentials are securely stored in Replit Secrets. OTP codes are now sent via email instead of being logged to the console.

### Running the Project

- **Development**: The workflows run automatically - MongoDB starts first, then the application server
- **Manual Start**: Use `npm run dev` to start the development server (ensure MongoDB is running)
- **Build**: Use `npm run build` to create a production build
- **Production**: Use `npm run start` to run the production server
- **MongoDB**: The MongoDB workflow keeps the database running in the background

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

**Database**: MongoDB (running locally on Replit via Nix packages at localhost:27017).

**ODM**: Mongoose for MongoDB with schema-based document modeling and validation.

**Schema Design (Collections)**:
- `users`: Stores user credentials, cryptographic keys, authorized IPs, verification status
- `blocks`: Blockchain storage with encrypted message payloads
- `otps`: One-time passwords for email verification (auto-expiring)
- `ipauthorizations`: IP-based access control with token verification

**Data Encryption**: Sensitive fields (username, email, phone, fullName, dateOfBirth, private keys, message content) are encrypted at rest using AES encryption with a master encryption key via Mongoose getter/setter hooks.

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
- Strict IP validation on every authenticated request
- Automatic IP change detection with re-authorization flow

**IP Authorization System (Enhanced October 25, 2025)**:
- **Registration**: User's IP is automatically captured and stored in `authorizedIPs` array during account creation
- **Login**: System checks if login IP matches any authorized IP; blocks unknown IPs and sends email verification
- **Authenticated Requests**: Every API call validates the request IP against authorized IPs via middleware
- **Socket Connections**: WebSocket connections also validate IP before establishing connection
- **IP Change Detection**: When user switches networks (e.g., mobile hotspot to Wi-Fi), system detects the new IP and requires email authorization before allowing access
- **Email Verification**: User receives authorization link via email with 1-hour expiration
- **IP Normalization**: All IPs are normalized (IPv4/IPv6 handling) before storage and comparison to ensure consistency
- **Security**: Prevents unauthorized access even with valid JWT tokens if IP changes

**User Registration Process**:
1. Username availability check
2. Email OTP generation and verification
3. Cryptographic key pair generation
4. Account creation with encrypted credentials
5. Initial IP address automatically authorized and stored

## External Dependencies

### Third-party Services

**Email Service**: Nodemailer with configurable SMTP provider (Gmail by default) for:
- OTP delivery during registration
- IP authorization notifications
- Security alerts

**hCaptcha**: Client-side bot prevention during authentication flows.

### Database & Infrastructure

**MongoDB**: NoSQL document database running locally via Nix packages on localhost:27017.

**Environment Variables Required**:
- `MONGODB_URI`: MongoDB connection string (defaults to `mongodb://localhost:27017/swapchat`)
- `JWT_SECRET`: Secret key for JWT signing
- `ENCRYPTION_MASTER_KEY`: Master key for field encryption (minimum 32 characters)
- `EMAIL_SERVICE`: SMTP service provider
- `EMAIL_USER`: Email sender address
- `EMAIL_PASSWORD`: Email account password
- `REPLIT_DEV_DOMAIN`: Development domain for CORS (auto-configured by Replit)

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

**Database & Backend**:
- `mongoose`: MongoDB ODM for schema-based modeling
- `socket.io`: Real-time WebSocket communication
- `express`: Web application framework

**Development Tools**:
- `vite`: Build tool and dev server
- `tsx`: TypeScript execution for development
- `esbuild`: Server-side bundling for production

**Validation**:
- `zod`: Schema validation
- `@hookform/resolvers`: Form validation integration
- `express-validator`: API input validation