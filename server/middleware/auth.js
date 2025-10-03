import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticateToken(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = {
      id: user._id,
      username: user.username,
      publicKey: user.publicKey,
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

export function authenticateSocket(socket, next) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
}
