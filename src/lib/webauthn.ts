import crypto from "crypto";

export interface WebAuthnJWK {
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
}

/**
 * Base64URL encoding/decoding utilities
 */
export function bufferToBase64Url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function base64UrlToBuffer(str: string): Buffer {
  return Buffer.from(str, "base64url");
}

/**
 * Lightweight CBOR parser to extract Credential ID and COSE P-256 Key from WebAuthn attestationObject (fmt: 'none' or standard)
 */
export function parseAttestationObject(attestationBuffer: Buffer): {
  authData: Buffer;
  credentialId: string;
  publicKeyJwk: WebAuthnJWK;
  counter: number;
} {
  // Attestation object in WebAuthn is CBOR. Find authData.
  // In typical Level 2/3 WebAuthn with 'none' attestation, authData starts after CBOR headers.
  const authDataIndex = attestationBuffer.indexOf(Buffer.from("authData"));
  let authData: Buffer;

  if (authDataIndex !== -1) {
    let offset = authDataIndex + 8; // skip 'authData'
    const lengthByte = attestationBuffer[offset++];
    let authDataLength = 0;

    if (lengthByte === 0x58) {
      authDataLength = attestationBuffer[offset++];
    } else if (lengthByte === 0x59) {
      authDataLength = attestationBuffer.readUInt16BE(offset);
      offset += 2;
    } else if (lengthByte === 0x5a) {
      authDataLength = attestationBuffer.readUInt32BE(offset);
      offset += 4;
    } else if ((lengthByte & 0xe0) === 0x40) {
      authDataLength = lengthByte & 0x1f;
    }

    authData = attestationBuffer.subarray(offset, offset + authDataLength);
  } else {
    // If not framed with text key "authData", assume raw authData
    authData = attestationBuffer;
  }

  if (authData.length < 37) {
    throw new Error("Invalid authenticatorData: too short");
  }

  const flags = authData[32];
  const counter = authData.readUInt32BE(33);

  // Check AT flag (Attested Credential Data Present = bit 6 / 0x40)
  if (!(flags & 0x40)) {
    throw new Error("Attested credential data not present in authenticatorData");
  }

  // Offset 37: aaguid (16 bytes)
  // Offset 53: credIdLen (2 bytes, uint16BE)
  const credIdLen = authData.readUInt16BE(53);
  const credentialId = authData.subarray(55, 55 + credIdLen).toString("base64url");

  // Offset after credId: COSE public key
  const coseOffset = 55 + credIdLen;
  const coseBuffer = authData.subarray(coseOffset);

  // Parse COSE EC2 Key for P-256 (x at key -2, y at key -3)
  const { x, y } = parseCoseEcKey(coseBuffer);

  const publicKeyJwk: WebAuthnJWK = {
    kty: "EC",
    crv: "P-256",
    x: x.toString("base64url"),
    y: y.toString("base64url"),
  };

  return { authData, credentialId, publicKeyJwk, counter };
}

/**
 * Extracts x and y coordinates from a COSE P-256 Public Key map
 */
function parseCoseEcKey(buf: Buffer): { x: Buffer; y: Buffer } {
  let offset = 0;
  const firstByte = buf[offset++];
  let mapLen = firstByte & 0x1f;
  if (firstByte === 0xb8) {
    mapLen = buf[offset++];
  }

  let x: Buffer | null = null;
  let y: Buffer | null = null;

  for (let i = 0; i < mapLen && offset < buf.length; i++) {
    // Read key
    const kByte = buf[offset++];
    let keyNum: number;
    if ((kByte & 0xe0) === 0x00) {
      keyNum = kByte & 0x1f;
    } else if ((kByte & 0xe0) === 0x20) {
      keyNum = -(1 + (kByte & 0x1f));
    } else {
      keyNum = 0;
    }

    // Read value
    if (offset >= buf.length) break;
    const vByte = buf[offset++];
    const majorType = vByte & 0xe0;

    if (majorType === 0x40) {
      // Byte string
      let strLen = vByte & 0x1f;
      if (vByte === 0x58) strLen = buf[offset++];
      else if (vByte === 0x59) {
        strLen = buf.readUInt16BE(offset);
        offset += 2;
      }
      const valBytes = buf.subarray(offset, offset + strLen);
      offset += strLen;

      if (keyNum === -2) x = valBytes;
      if (keyNum === -3) y = valBytes;
    } else if (majorType === 0x00 || majorType === 0x20) {
      // Small int, skip
      if (vByte === 0x18 || vByte === 0x38) offset += 1;
      else if (vByte === 0x19 || vByte === 0x39) offset += 2;
      else if (vByte === 0x1a || vByte === 0x3a) offset += 4;
    }
  }

  if (!x || !y) {
    // Fallback search: look for 32-byte sequences in COSE buffer
    // A standard P-256 public key has 32-byte X and 32-byte Y
    for (let i = 0; i <= buf.length - 64; i++) {
      if (buf[i] === 0x58 && buf[i + 1] === 0x20 && buf[i + 34] === 0x58 && buf[i + 35] === 0x20) {
        x = buf.subarray(i + 2, i + 34);
        y = buf.subarray(i + 36, i + 68);
        break;
      }
    }
  }

  if (!x || !y) {
    throw new Error("Unable to parse COSE EC2 public key from authenticatorData");
  }

  return { x, y };
}

/**
 * Verify WebAuthn ECDSA Signature against the user's stored public key
 */
export function verifyWebAuthnSignature(
  publicKeyJwk: WebAuthnJWK,
  clientDataJSON: string,
  authData: Buffer,
  signature: Buffer
): boolean {
  try {
    const clientDataHash = crypto.createHash("sha256").update(clientDataJSON).digest();
    const signedData = Buffer.concat([authData, clientDataHash]);

    const publicKey = crypto.createPublicKey({
      key: publicKeyJwk as crypto.JsonWebKey,
      format: "jwk",
    });

    return crypto.verify("sha256", signedData, publicKey, signature);
  } catch (err) {
    console.error("Signature verification exception:", err);
    return false;
  }
}

/**
 * Cryptographically signed short-lived Authorization Grant Token.
 * Prevents client boolean spoofing.
 */
export function signAuthGrant(userId: string, scope: string, ttlMs: number = 5 * 60 * 1000): string {
  const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-manageo-app-lock";
  const exp = Date.now() + ttlMs;
  const payload = `${userId}:${scope}:${exp}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

export function verifyAuthGrant(token: string, userId: string, expectedScope: string): boolean {
  try {
    if (!token || !token.includes(".")) return false;
    const [payloadB64, hmac] = token.split(".");
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const [tokenUserId, tokenScope, expStr] = payload.split(":");

    if (tokenUserId !== userId) return false;
    if (tokenScope !== expectedScope && expectedScope !== "any") return false;

    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) return false;

    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-manageo-app-lock";
    const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(expectedHmac, "hex"));
  } catch {
    return false;
  }
}
