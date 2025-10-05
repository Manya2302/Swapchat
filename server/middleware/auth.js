import jwt from 'jsonwebtoken';
import requestIp from 'request-ip';
import crypto from 'crypto';
import User from '../models/User.js';
import IPAuthorization from '../models/IPAuthorization.js';
import { sendIPAuthorizationEmail } from '../lib/emailService.js';

function normalizeIP(ip) {
  if (!ip) return ip;
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  if (ip.includes(':') && ip.split(':').length > 2 && ip.includes('.')) {
    const last = ip.split(':').pop();
    if (last && last.includes('.')) ip = last;
  } else if (ip.includes(':') && !ip.includes('.')) {
    ip = ip.split('%')[0];
  } else if (ip.includes(':') && ip.includes('.')) {
    ip = ip.split(':')[0];
  }
  return ip.trim();
}

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

    const rawClientIP = requestIp.getClientIp(req) || 
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
      req.connection.remoteAddress || 
      req.socket.remoteAddress || 
      req.ip;
    const clientIP = normalizeIP(rawClientIP);

    const isAuthorizedIP = user.authorizedIPs && user.authorizedIPs.some(auth => normalizeIP(auth.ip) === clientIP);

    if (!isAuthorizedIP) {
      console.log('--- IP MISMATCH DETECTED ---');
      console.log('User:', user.username);
      console.log('Current IP:', clientIP);
      console.log('Authorized IPs:', JSON.stringify(user.authorizedIPs));
      console.log('--- END IP MISMATCH ---');

      try {
        // Remove any previous pending (unauthorized) entries for this username+ip to avoid duplicates
        await IPAuthorization.deleteMany({ username: user.username, ip: clientIP, authorized: false });

        const authToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        const ipAuth = new IPAuthorization({
          username: user.username,
          ip: clientIP,
          token: authToken,
          userAgent: req.headers['user-agent'],
          expiresAt,
        });

        // Store normalized IP on the ipAuth record as well
        ipAuth.ip = normalizeIP(ipAuth.ip);
        await ipAuth.save();

        const authUrl = `${req.protocol}://${req.get('host')}/api/auth/authorize-ip?token=${authToken}`;

        // Send email (don't fail the request if email sending fails)
        sendIPAuthorizationEmail(user.email, user.username, ipAuth.ip, authUrl).catch(err => {
          console.error('Failed to send IP authorization email:', err);
        });
      } catch (err) {
        console.error('Error creating/sending IP authorization:', err);
      }

      return res.status(403).json({ 
        error: 'IP_NOT_AUTHORIZED',
        message: 'Your IP address has changed. An authorization email has been sent to your account. Please verify the new IP to continue.',
        requiresReauth: true
      });
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

    // Additionally enforce IP-based authorization for socket connections
    (async () => {
      try {
        const user = await User.findById(decoded.userId);
        if (!user) return next(new Error('Authentication error'));

        const rawClientIP = socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() || socket.handshake.address;
        const clientIP = normalizeIP(rawClientIP);

        const isAuthorizedIP = user.authorizedIPs && user.authorizedIPs.some(auth => normalizeIP(auth.ip) === clientIP);
        if (!isAuthorizedIP) {
          // create IPAuthorization and send email, then reject socket connection
          try {
            await IPAuthorization.deleteMany({ username: user.username, ip: clientIP, authorized: false });
            const authToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
            const ipAuth = new IPAuthorization({
              username: user.username,
              ip: clientIP,
              token: authToken,
              userAgent: socket.handshake.headers['user-agent'],
              expiresAt,
            });
            ipAuth.ip = normalizeIP(ipAuth.ip);
            await ipAuth.save();
            const authUrl = `https://${socket.handshake.headers.host}/api/auth/authorize-ip?token=${authToken}`;
            sendIPAuthorizationEmail(user.email, user.username, ipAuth.ip, authUrl).catch(console.error);
          } catch (e) {
            console.error('Socket IP auth error:', e);
          }
          return next(new Error('IP_NOT_AUTHORIZED'));
        }

        next();
      } catch (e) {
        console.error('Socket auth processing error:', e);
        return next(new Error('Authentication error'));
      }
    })();
  } catch (error) {
    next(new Error('Authentication error'));
  }
}
