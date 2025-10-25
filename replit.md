# Swapchat - Blockchain Messaging Platform

## Overview

Swapchat is a secure messaging application that leverages blockchain technology to ensure message immutability, cryptographic verification, and tamper-proof history. It combines end-to-end encryption with blockchain security to offer a transparent and auditable messaging system. The platform features a WhatsApp-like UI, real-time communication via WebSockets, and a blockchain ledger viewer for message auditing. The project's ambition is to provide a highly secure, privacy-focused messaging solution with a unique user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript using Vite, leveraging `shadcn/ui` components based on Radix UI for a consistent, dark-themed design. Styling is managed with TailwindCSS, featuring a "Swapchat" brand identity with dark gradients, a primary "Swapgreen" color, and coral accents. State management uses TanStack Query for server state and React hooks for local state, with Wouter handling client-side routing. Key design patterns include component composition, separation of concerns, and custom hooks.

### Backend Architecture

The backend runs on Node.js with Express.js, providing RESTful APIs for authentication, user management (profiles, contacts, search), stories, and blockchain access. Real-time communication is handled by Socket.IO. Security features include Helmet.js, CORS, rate limiting, cookie-based sessions, JWT tokens, and an enhanced IP authorization system that validates user IPs on login and every authenticated request, requiring email verification for new devices.

**Encryption Strategy**:
1.  **Client-side End-to-End Encryption**: Utilizes NaCl (TweetNaCl) where private keys are client-generated and stored locally, never transmitted. Only public keys are stored on the server.
2.  **Server-side Field Encryption**: AES encryption with a master key is applied to sensitive data at rest in the database.
3.  **Password Hashing**: Bcrypt with 12 rounds.

**Blockchain Implementation**: A custom, lightweight blockchain stores each message as a block, including index, timestamp, sender, recipient, encrypted payload, previous hash, and current hash. SHA-256 is used for block integrity, and the system includes chain validation capabilities.

### Data Storage

MongoDB is used as the database, running locally within the Replit environment. Mongoose provides ODM capabilities for schema-based modeling. Key collections include `users`, `blocks`, `otps`, `ipauthorizations`, `stories`, and `storyviews`. Sensitive fields are encrypted at rest using AES via Mongoose hooks. User public keys are stored on the server, while private keys remain client-side, ensuring true end-to-end encryption.

## External Dependencies

### Third-party Services

*   **Nodemailer**: Used for sending OTPs and IP authorization emails via SMTP (e.g., Gmail).
*   **hCaptcha**: Implemented for bot prevention during authentication.

### Database & Infrastructure

*   **MongoDB**: NoSQL document database.
*   **Environment Variables**: `MONGODB_URI`, `JWT_SECRET`, `ENCRYPTION_MASTER_KEY`, `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `REPLIT_DEV_DOMAIN`.

### Key Libraries

*   **Cryptography**: `crypto-js` (AES), `bcryptjs`, `jsonwebtoken`.
*   **UI Framework**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`.
*   **Database & Backend**: `mongoose`, `socket.io`, `express`.
*   **Development Tools**: `vite`, `tsx`, `esbuild`.
*   **Validation**: `zod`, `@hookform/resolvers`, `express-validator`.