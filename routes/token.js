const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const PASSPHRASE = "picanetpace";

// --- Helpers ---
function deriveKey(passphrase) {
  return crypto.createHash("sha256").update(passphrase).digest();
}

function generateAesGcmToken(passphrase) {
  const iv = crypto.randomBytes(12); // 12-byte IV for GCM
  const key = deriveKey(passphrase);

  const timestamp = Date.now().toString();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([cipher.update(timestamp, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Pack = IV + ciphertext + tag
  const combined = Buffer.concat([iv, ciphertext, authTag]);

  // Base64URL encode
  return combined.toString("base64url");
}

// --- Middleware to enforce same-origin ---
function sameOriginOnly(req, res, next) {
    const origin = req.get('Origin') || req.get('Referer') || '';
  const host = req.headers.host;

  // If request has no origin (like curl, Postman) -> block
  if (!origin) {
    return res.status(403).json({ error: "Forbidden: Missing origin" });
  }

  // Check that origin matches the backend host
  if (!origin.includes(host)) {
    return res.status(403).json({ error: "Forbidden: Origin mismatch" });
  }

  next();
}

router.get("/", sameOriginOnly, (req, res) => {
  const token = generateAesGcmToken(PASSPHRASE);
  res.json({ token });
});

module.exports = router;