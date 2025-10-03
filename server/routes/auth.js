import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import IPAuthorization from '../models/IPAuthorization.js';
import { sendOTPEmail, sendIPAuthorizationEmail } from '../lib/emailService.js';
import { encryptField } from '../lib/encryption.js';
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
      
      const allUsers = await User.find({});
      const usernameTaken = allUsers.some(user => user.username === username);

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
      
      await OTP.deleteMany({ email: encryptField(email), verified: false });

      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const otpDoc = new OTP({
        email,
        otp,
        expiresAt,
      });

      await otpDoc.save();

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

      const otpDoc = await OTP.findOne({
        email: encryptField(email),
        otp,
        verified: false,
      });

      if (!otpDoc) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      if (new Date() > otpDoc.expiresAt) {
        await OTP.deleteOne({ _id: otpDoc._id });
        return res.status(400).json({ error: 'OTP expired' });
      }

      otpDoc.verified = true;
      await otpDoc.save();

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

      const otpDoc = await OTP.findOne({
        email: encryptField(email),
        verified: true,
      });

      if (!otpDoc) {
        return res.status(400).json({ error: 'Email not verified' });
      }

      const allUsers = await User.find({});
      const usernameTaken = allUsers.some(user => user.username === username);

      if (usernameTaken) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      const user = new User({
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

      await user.save();

      await OTP.deleteMany({ email: encryptField(email) });

      const token = jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
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

async function verifyCaptcha(token) {
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
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        return res.status(400).json({ error: 'Invalid CAPTCHA' });
      }

      const allUsers = await User.find({});
      const user = allUsers.find(u => u.username === username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const passwordMatch = await user.comparePassword(password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const ipAuthorized = user.authorizedIPs.some(
        auth => auth.ip === clientIP && new Date() < new Date(auth.authorizedAt).getTime() + 30 * 24 * 60 * 60 * 1000
      );

      if (!ipAuthorized) {
        const authToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        const ipAuth = new IPAuthorization({
          username,
          ip: clientIP,
          token: authToken,
          userAgent,
          expiresAt,
        });

        await ipAuth.save();

        const authUrl = `${req.protocol}://${req.get('host')}/api/auth/authorize-ip?token=${authToken}`;
        await sendIPAuthorizationEmail(user.email, username, clientIP, authUrl);

        return res.status(403).json({
          error: 'IP_AUTHORIZATION_REQUIRED',
          message: 'New device detected. Please check your email to authorize this device.',
        });
      }

      const token = jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
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

    const ipAuth = await IPAuthorization.findOne({ token, authorized: false });

    if (!ipAuth) {
      return res.status(400).send('<h1>Invalid or expired authorization link</h1>');
    }

    if (new Date() > ipAuth.expiresAt) {
      await IPAuthorization.deleteOne({ _id: ipAuth._id });
      return res.status(400).send('<h1>Authorization link expired</h1>');
    }

    const allUsers = await User.find({});
    const user = allUsers.find(u => u.username === ipAuth.username);

    if (!user) {
      return res.status(400).send('<h1>User not found</h1>');
    }

    user.authorizedIPs.push({
      ip: ipAuth.ip,
      authorizedAt: new Date(),
      userAgent: ipAuth.userAgent,
    });

    await user.save();

    ipAuth.authorized = true;
    await ipAuth.save();

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
