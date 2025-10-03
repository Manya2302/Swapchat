import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user.id }
    }).select('username publicKey');

    const contacts = users.map(user => ({
      id: user._id,
      username: user.username,
      publicKey: user.publicKey,
    }));

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
