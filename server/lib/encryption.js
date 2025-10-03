import crypto from 'crypto';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_MASTER_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_MASTER_KEY must be at least 32 characters');
}

export function encryptField(text) {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decryptField(encryptedText) {
  if (!encryptedText) return encryptedText;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

export function encryptMessage(message, recipientPublicKey) {
  return CryptoJS.AES.encrypt(message, recipientPublicKey).toString();
}

export function decryptMessage(encryptedMessage, privateKey) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, privateKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Message decryption error:', error);
    return null;
  }
}

export function generateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
