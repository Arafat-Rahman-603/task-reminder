// Utility functions for Web Crypto API based E2EE

// Buffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Base64 to Buffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a random salt or IV
export function generateRandomBytes(length: number): ArrayBuffer {
  return window.crypto.getRandomValues(new Uint8Array(length)).buffer;
}

// Derive AES-GCM Key from Password using PBKDF2
export async function deriveKey(password: string, saltBuffer: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(plaintext: string, password: string): Promise<{ encryptedData: string, iv: string, salt: string }> {
  const salt = generateRandomBytes(16);
  const iv = generateRandomBytes(12);
  
  const key = await deriveKey(password, salt);
  
  const enc = new TextEncoder();
  const encodedData = enc.encode(plaintext);
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(iv)
    },
    key,
    encodedData
  );

  return {
    encryptedData: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt)
  };
}

export async function decryptData(encryptedDataB64: string, ivB64: string, saltB64: string, password: string): Promise<string> {
  try {
    const encryptedBuffer = base64ToBuffer(encryptedDataB64);
    const iv = base64ToBuffer(ivB64);
    const salt = base64ToBuffer(saltB64);
    
    const key = await deriveKey(password, salt);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv)
      },
      key,
      encryptedBuffer
    );
    
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error("Decryption failed. Incorrect password or corrupted data.");
  }
}
