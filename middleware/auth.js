import crypto from "crypto";

function deriveKey(passphrase) {
  return crypto.createHash("sha256").update(passphrase).digest();
}

function decryptAesGcmToken(token, passphrase) {
  const combined = Buffer.from(token, "base64url");
  const iv = combined.subarray(0, 12);
  const ciphertextAndTag = combined.subarray(12);

  const ciphertext = ciphertextAndTag.subarray(0, ciphertextAndTag.length - 16);
  const authTag = ciphertextAndTag.subarray(ciphertextAndTag.length - 16);

  const key = deriveKey(passphrase);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return parseInt(decrypted.toString("utf8"), 10);
}

export function verifyTokenMiddleware(req, res, next) {
  const token = req.query.token; // from query param
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const timestamp = decryptAesGcmToken(token, "pica-netpace");
    const now = Date.now();
    if (now - timestamp <= 5 * 60 * 1000) {
      return next(); // ✅ valid, continue
    } else {
      return res.status(401).json({ error: "Token expired" });
    }
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
