import { db } from '../../db.js';
import { otps } from '../../../shared/schema.js';
import { eq, and, lt, gt } from 'drizzle-orm';

export async function deleteUnverifiedOTPs(email: string) {
  await db.delete(otps).where(
    and(
      eq(otps.email, email),
      eq(otps.verified, false)
    )
  );
}

export async function createOTP(email: string, otp: string, expiresAt: Date) {
  const [otpRecord] = await db.insert(otps).values({
    email,
    otp,
    expiresAt,
  }).returning();
  
  return otpRecord;
}

export async function findValidOTP(email: string, otpCode: string) {
  const now = new Date();
  const [otpRecord] = await db.select().from(otps)
    .where(
      and(
        eq(otps.email, email),
        eq(otps.otp, otpCode),
        eq(otps.verified, false),
        gt(otps.expiresAt, now)
      )
    );
  
  return otpRecord;
}

export async function markOTPVerified(id: string) {
  await db.update(otps)
    .set({ verified: true })
    .where(eq(otps.id, id));
}

export async function deleteExpiredOTPs() {
  const now = new Date();
  await db.delete(otps).where(lt(otps.expiresAt, now));
}
