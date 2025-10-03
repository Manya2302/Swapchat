import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_MASTER_KEY || 'default-dev-key-min-32-chars-long';

export function encryptField(value) {
  if (!value) return value;
  return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
}

export function decryptField(value) {
  if (!value) return value;
  try {
    const bytes = CryptoJS.AES.decrypt(value, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return value;
  }
}
