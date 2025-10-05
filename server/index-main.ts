
// Load .env into process.env for local development
import dotenv from 'dotenv';
dotenv.config();

console.log('Starting server initialization...');

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';

console.log('Basic imports loaded');

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import blockchainRoutes from './routes/blockchain.js';
import { initializeBlockchain, addMessageBlock } from './lib/blockchain.js';
import { authenticateSocket } from './middleware/auth.js';
import { setupVite, serveStatic } from './vite.js';

console.log('All imports loaded');

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

const app = express();
const server = createServer(app);

app.set('trust proxy', true);

const io = new Server(server, {
  cors: {
    origin: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000',
    credentials: true,
  },
});

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  validate: { trustProxy: false },
});

app.use('/api/', limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/blockchain', blockchainRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.use(authenticateSocket);

const userSockets = new Map<string, string>();

io.on('connection', (socket: AuthenticatedSocket) => {
  console.log(`User connected: ${socket.username}`);
  if (socket.username) {
    userSockets.set(socket.username, socket.id);
  }

  socket.emit('connected', { username: socket.username });

  socket.on('send-message', async (data) => {
    try {
      const { to, encryptedPayload } = data;
      
      const block = await addMessageBlock(
        socket.username!,
        to,
        encryptedPayload
      );

      const recipientSocketId = userSockets.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive-message', {
          from: socket.username,
          block: {
            index: block.index,
            timestamp: block.timestamp,
            hash: block.hash,
            prevHash: block.prevHash,
            payload: block.payload,
          },
        });
      }

      socket.emit('message-sent', {
        blockNumber: block.index,
        hash: block.hash,
        timestamp: block.timestamp,
      });

      console.log(`Message block #${block.index} created: ${socket.username} -> ${to}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username}`);
    if (socket.username) {
      userSockets.delete(socket.username);
    }
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

(async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swapchat';
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected');
    
    await initializeBlockchain();
    console.log('✓ Blockchain initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
    process.exit(1);
  }

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || '5000', 10);
  const listenOptions: any = { port: PORT, host: "0.0.0.0" };
  // reusePort isn't supported on some Windows builds / environments. Only enable it on non-Windows.
  if (process.platform !== 'win32') {
    listenOptions.reusePort = true;
  }

  server.listen(listenOptions, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
})();

export default server;
