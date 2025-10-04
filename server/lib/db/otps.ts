
import { db } from '../../db.js';
import { otps } from '../../../shared/schema.js';
import { eq, and, lt, gt } from 'drizzle-orm';
import { encryptField, decryptField } from '../encryption.js';

export async function deleteUnverifiedOTPs(email: string) {
  const encryptedEmail = encryptField(email);
  const allOtps = await db.select().from(otps);
  const toDelete = allOtps.filter(otp => 
    decryptField(otp.email) === email && !otp.verified
  );
  
  for (const otp of toDelete) {
    await db.delete(otps).where(eq(otps.id, otp.id));
  }
}

export async function createOTP(email: string, otp: string, expiresAt: Date) {
  const [otpRecord] = await db.insert(otps).values({
    email: encryptField(email),
    otp,
    expiresAt,
  }).returning();
  
  return otpRecord;
}

export async function findValidOTP(email: string, otpCode: string) {
  const now = new Date();
  const allOtps = await db.select().from(otps);
  
  const validOtp = allOtps.find(otp => {
    const decryptedEmail = decryptField(otp.email);
    // Ensure expiresAt is a Date object
    const expiresAt = otp.expiresAt instanceof Date ? otp.expiresAt : new Date(otp.expiresAt);
    // Allow a small grace period (1 minute) for clock skew between systems
    const graceMs = 60 * 1000;
    return decryptedEmail === email &&
           otp.otp === otpCode &&
           !otp.verified &&
           (expiresAt.getTime() + graceMs) > now.getTime();
  });
  
  return validOtp;
}

export async function findVerifiedOTP(email: string) {
  const allOtps = await db.select().from(otps);
  return allOtps.find(otp => decryptField(otp.email) === email && otp.verified);
}

export async function markOTPVerified(id: string) {
  await db.update(otps)
    .set({ verified: true })
    .where(eq(otps.id, id));
}

export async function deleteOTPsByEmail(email: string) {
  const allOtps = await db.select().from(otps);
  const toDelete = allOtps.filter(otp => decryptField(otp.email) === email);
  
  for (const otp of toDelete) {
    await db.delete(otps).where(eq(otps.id, otp.id));
  }
}

export async function deleteExpiredOTPs() {
  const now = new Date();
  await db.delete(otps).where(lt(otps.expiresAt, now));
}
