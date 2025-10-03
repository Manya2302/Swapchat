import { db } from '../../db.js';
import { ipAuthorizations } from '../../../shared/schema.js';
import { eq, and, gt, lt } from 'drizzle-orm';

export async function createIPAuthorization(data: {
  username: string;
  ip: string;
  token: string;
  userAgent?: string;
  expiresAt: Date;
}) {
  const [ipAuth] = await db.insert(ipAuthorizations).values(data).returning();
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
  
  return ipAuth;
}

export async function authorizeIP(id: string) {
  await db.update(ipAuthorizations)
    .set({ authorized: true })
    .where(eq(ipAuthorizations.id, id));
}

export async function findAuthorizedIP(username: string, ip: string) {
  const now = new Date();
  const [ipAuth] = await db.select().from(ipAuthorizations)
    .where(
      and(
        eq(ipAuthorizations.username, username),
        eq(ipAuthorizations.ip, ip),
        eq(ipAuthorizations.authorized, true),
        gt(ipAuthorizations.expiresAt, now)
      )
    );
  
  return ipAuth;
}

export async function deleteExpiredIPAuths() {
  const now = new Date();
  await db.delete(ipAuthorizations).where(lt(ipAuthorizations.expiresAt, now));
}
