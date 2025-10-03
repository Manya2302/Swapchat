import express from 'express';
import { getUsersExcludingId, findUserById } from '../lib/db/users.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await getUsersExcludingId((req as any).user.id);

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById((req as any).user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
