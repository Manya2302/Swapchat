import { db } from '../../db.js';
import { users } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function createUser(userData: {
  username: string;
  email: string;
  phone: string;
  fullName: string;
  dateOfBirth: string;
  password: string;
  publicKey: string;
  privateKey: string;
}) {
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  const [user] = await db.insert(users).values({
    ...userData,
    password: hashedPassword,
  }).returning();
  
  return user;
}

export async function findUserByUsername(username: string) {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user;
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getAllUsers() {
  return await db.select().from(users);
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
  
  return allUsers.filter(user => user.id !== excludeId);
}
