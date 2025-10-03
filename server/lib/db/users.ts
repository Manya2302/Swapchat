import { db } from '../../db.js';
import { users } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { encryptField, decryptField } from '../encryption.js';

export async function createUser(userData: {
  username: string;
  email: string;
  phone: string;
  fullName: string;
  dateOfBirth: string;
  password: string;
  publicKey: string;
  privateKey: string;
  isVerified?: boolean;
}) {
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  const [user] = await db.insert(users).values({
    username: encryptField(userData.username),
    email: encryptField(userData.email),
    phone: encryptField(userData.phone),
    fullName: encryptField(userData.fullName),
    dateOfBirth: encryptField(userData.dateOfBirth),
    password: hashedPassword,
    publicKey: userData.publicKey,
    privateKey: encryptField(userData.privateKey),
    isVerified: userData.isVerified || false,
  }).returning();
  
  return decryptUserFields(user);
}

function decryptUserFields(user: any) {
  if (!user) return null;
  return {
    ...user,
    username: decryptField(user.username) || user.username,
    email: decryptField(user.email) || user.email,
    phone: decryptField(user.phone) || user.phone,
    fullName: decryptField(user.fullName) || user.fullName,
    dateOfBirth: decryptField(user.dateOfBirth) || user.dateOfBirth,
    privateKey: decryptField(user.privateKey) || user.privateKey,
  };
}

export async function findUserByUsername(username: string) {
  const allUsers = await db.select().from(users);
  return allUsers.map(decryptUserFields).find(u => u.username === username);
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return decryptUserFields(user);
}

export async function getAllUsers() {
  const allUsers = await db.select().from(users);
  return allUsers.map(decryptUserFields);
}

export async function comparePassword(plainPassword: string, hashedPassword: string) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export async function updateUserAuthorizedIPs(userId: string, authorizedIPs: Array<{
  ip: string;
  authorizedAt: string;
  userAgent: string;
}>) {
  await db.update(users)
    .set({ authorizedIPs })
    .where(eq(users.id, userId));
}

export async function setUserVerified(userId: string) {
  await db.update(users)
    .set({ isVerified: true })
    .where(eq(users.id, userId));
}

export async function getUsersExcludingId(excludeId: string) {
  const allUsers = await db.select({
    id: users.id,
    username: users.username,
    publicKey: users.publicKey,
  }).from(users);
  
  return allUsers
    .map(u => ({
      id: u.id,
      username: decryptField(u.username) || u.username,
      publicKey: u.publicKey,
    }))
    .filter(user => user.id !== excludeId);
}
