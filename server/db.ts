import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/swapchat';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI or DATABASE_URL must be set');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export const db = mongoose.connection;
