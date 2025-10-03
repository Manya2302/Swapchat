import { db } from '../../db.js';
import { ipAuthorizations } from '../../../shared/schema.js';
import { eq, and, gt, lt } from 'drizzle-orm';
import { encryptField, decryptField } from '../encryption.js';

export async function createIPAuthorization(data: {
  username: string;
  ip: string;
  token: string;
  userAgent?: string;
  expiresAt: Date;
}) {
  const [ipAuth] = await db.insert(ipAuthorizations).values({
    username: encryptField(data.username),
    ip: data.ip,
    token: data.token,
    userAgent: data.userAgent,
    expiresAt: data.expiresAt,
  }).returning();
  
  return ipAuth;
}

export async function findIPAuthByToken(token: string) {
  const now = new Date();
  const [ipAuth] = await db.select().from(ipAuthorizations)
    .where(
      and(
        eq(ipAuthorizations.token, token),
        gt(ipAuthorizations.expiresAt, now)
      )
    );
  
  if (!ipAuth) return null;
  
  return {
    ...ipAuth,
    username: decryptField(ipAuth.username) || ipAuth.username,
  };
}

export async function authorizeIP(id: string) {
  await db.update(ipAuthorizations)
    .set({ authorized: true })
    .where(eq(ipAuthorizations.id, id));
}

export async function findAuthorizedIP(username: string, ip: string) {
  const now = new Date();
  const allIpAuths = await db.select().from(ipAuthorizations)
    .where(
      and(
        eq(ipAuthorizations.ip, ip),
        eq(ipAuthorizations.authorized, true),
        gt(ipAuthorizations.expiresAt, now)
      )
    );
  
  return allIpAuths.find(ipAuth => decryptField(ipAuth.username) === username);
}

export async function deleteExpiredIPAuths() {
  const now = new Date();
  await db.delete(ipAuthorizations).where(lt(ipAuthorizations.expiresAt, now));
}
