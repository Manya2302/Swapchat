import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createUser, findUserByUsername, getAllUsers, comparePassword, updateUserAuthorizedIPs } from '../lib/db/users.js';
import { deleteUnverifiedOTPs, createOTP, findValidOTP, findVerifiedOTP, markOTPVerified, deleteOTPsByEmail } from '../lib/db/otps.js';
import { createIPAuthorization, findIPAuthByToken, authorizeIP } from '../lib/db/ipAuthorizations.js';
import { sendOTPEmail, sendIPAuthorizationEmail } from '../lib/emailService.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.post('/check-username',
  body('username').trim().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username } = req.body;
      
      const allUsers = await getAllUsers();
      const usernameTaken = allUsers.some((user: any) => user.username === username);

      res.json({ available: !usernameTaken });
    } catch (error) {
      console.error('Username check error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post('/send-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('fullName').trim().isLength({ min: 2 }),
    body('phone').trim().matches(/^[0-9+\-() ]+$/),
    body('dateOfBirth').isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      
      await deleteUnverifiedOTPs(email);

      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await createOTP(email, otp, expiresAt);

      const emailSent = await sendOTPEmail(email, otp);
      
      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send OTP email' });
      }

      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post('/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, otp } = req.body;

      const otpDoc = await findValidOTP(email, otp);

      if (!otpDoc) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      await markOTPVerified(otpDoc.id);

      res.json({ message: 'OTP verified successfully' });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post('/register',
  [
    body('username').trim().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('password').isLength({ min: 8 }),
    body('email').isEmail().normalizeEmail(),
    body('fullName').trim().isLength({ min: 2 }),
    body('phone').trim().matches(/^[0-9+\-() ]+$/),
    body('dateOfBirth').isISO8601(),
    body('publicKey').notEmpty(),
    body('privateKey').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password, email, fullName, phone, dateOfBirth, publicKey, privateKey } = req.body;

      const otpDoc = await findVerifiedOTP(email);

      if (!otpDoc) {
        return res.status(400).json({ error: 'Email not verified' });
      }

      const allUsers = await getAllUsers();
      const usernameTaken = allUsers.some((u: any) => u.username === username);

      if (usernameTaken) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      const user = await createUser({
        username,
        password,
        email,
        fullName,
        phone,
        dateOfBirth,
        publicKey,
        privateKey,
        isVerified: true,
      });

      await deleteOTPsByEmail(email);

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'default-secret-key-change-me',
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

async function verifyCaptcha(token: string) {
  const response = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `response=${token}&secret=${process.env.HCAPTCHA_SECRET_KEY}`,
  });
  
  const data = await response.json();
  return data.success;
}

router.post('/login',
  [
    body('username').trim().notEmpty(),
    body('password').notEmpty(),
    body('captchaToken').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password, captchaToken } = req.body;
      const clientIP = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        return res.status(400).json({ error: 'Invalid CAPTCHA' });
      }

      const user = await findUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const ipAuthorized = user.authorizedIPs.some(
        (auth: any) => auth.ip === clientIP && new Date() < new Date(new Date(auth.authorizedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
      );

      if (!ipAuthorized) {
        const authToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await createIPAuthorization({
          username,
          ip: clientIP,
          token: authToken,
          userAgent,
          expiresAt,
        });

        const authUrl = `${req.protocol}://${req.get('host')}/api/auth/authorize-ip?token=${authToken}`;
        await sendIPAuthorizationEmail(user.email, username, clientIP, authUrl);

        return res.status(403).json({
          error: 'IP_AUTHORIZATION_REQUIRED',
          message: 'New device detected. Please check your email to authorize this device.',
        });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'default-secret-key-change-me',
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/authorize-ip', async (req, res) => {
  try {
    const { token } = req.query;

    const ipAuth = await findIPAuthByToken(token as string);

    if (!ipAuth) {
      return res.status(400).send('<h1>Invalid or expired authorization link</h1>');
    }

    const user = await findUserByUsername(ipAuth.username);

    if (!user) {
      return res.status(400).send('<h1>User not found</h1>');
    }

    const authorizedIPs = user.authorizedIPs || [];
    authorizedIPs.push({
      ip: ipAuth.ip,
      authorizedAt: new Date().toISOString(),
      userAgent: ipAuth.userAgent || '',
    });

    await updateUserAuthorizedIPs(user.id, authorizedIPs);
    await authorizeIP(ipAuth.id);

    res.send(`
      <html>
        <head>
          <title>Device Authorized - Swapchat</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #0b1020, #1b1f3a);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255,255,255,0.1);
              border-radius: 10px;
            }
            h1 { color: #2DE2A9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Device Authorized</h1>
            <p>You can now close this window and return to Swapchat to log in.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('IP authorization error:', error);
    res.status(500).send('<h1>Server error</h1>');
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
