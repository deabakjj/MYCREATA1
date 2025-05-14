/**
 * Encryption Utility
 * 
 * Provides functions for encrypting and decrypting sensitive data
 * Used for securing API keys, tokens, and other confidential information
 * in the Nest platform's integration system.
 */

const crypto = require('crypto');

// Encryption settings
// In a production environment, these should be loaded from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a-very-secure-32-byte-encryption-key'; // 32 bytes for AES-256
const ENCRYPTION_IV_LENGTH = 16; // For AES, this is always 16 bytes
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts a string value
 * 
 * @param {string} value - The value to encrypt
 * @returns {string} - Encrypted value as a base64 string
 */
function encryptData(value) {
  if (!value) return null;
  
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    
    // Create cipher with key and iv
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY), 
      iv
    );
    
    // Encrypt the value
    let encrypted = cipher.update(value.toString(), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Prepend iv to encrypted data and convert to base64
    // This allows us to use a different iv for each encryption
    const ivAndEncrypted = Buffer.concat([iv, Buffer.from(encrypted, 'base64')]);
    return ivAndEncrypted.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts an encrypted value
 * 
 * @param {string} encryptedValue - The encrypted value (base64 string)
 * @returns {string} - Decrypted value
 */
function decryptData(encryptedValue) {
  if (!encryptedValue) return null;
  
  try {
    // Convert from base64 to buffer
    const buffer = Buffer.from(encryptedValue, 'base64');
    
    // Extract iv from the beginning of the buffer
    const iv = buffer.slice(0, ENCRYPTION_IV_LENGTH);
    
    // Extract the encrypted data
    const encrypted = buffer.slice(ENCRYPTION_IV_LENGTH).toString('base64');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY), 
      iv
    );
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

module.exports = {
  encryptData,
  decryptData
};
