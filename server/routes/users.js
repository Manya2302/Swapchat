import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const allUsers = await User.find({});
    const contacts = allUsers
      .filter(u => u._id.toString() !== req.user.id.toString())
      .map(user => ({
        id: user.publicKey,
        name: user.username,
        profileImage: user.profileImage || '',
        description: user.description || '',
        isOnline: false,
      }));

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      dateOfBirth: user.dateOfBirth,
      description: user.description || '',
      profileImage: user.profileImage || '',
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, dateOfBirth, description, profileImage } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (description !== undefined) user.description = description;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      dateOfBirth: user.dateOfBirth,
      description: user.description,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const searchQuery = query.startsWith('@') ? query.substring(1) : query;
    
    const allUsers = await User.find({});
    const matchingUsers = allUsers
      .filter(user => {
        if (user._id.toString() === req.user.id.toString()) return false;
        return user.username.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .map(user => ({
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        description: user.description || '',
        profileImage: user.profileImage || '',
        publicKey: user.publicKey,
        createdAt: user.createdAt,
      }));

    res.json(matchingUsers);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    
    const allUsers = await User.find({});
    const user = allUsers.find(u => u.username === username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      description: user.description || '',
      profileImage: user.profileImage || '',
      publicKey: user.publicKey,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
