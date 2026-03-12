import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const LEGACY_ENCRYPTION_KEY = process.env.LEGACY_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error('ENCRYPTION_KEY environment variable must be set (32 characters)');
}

const IV_LENGTH = 16;

export function encryptEmail(text: string) {
    if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY is not configured');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function tryDecryptWithKey(text: string, key: string): string | null {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch {
        return null;
    }
}

export function decryptEmail(text: string) {
    if (!text.includes(':')) return text; // Helper for legacy/plaintext

    // Try with current ENCRYPTION_KEY first
    if (ENCRYPTION_KEY) {
        const result = tryDecryptWithKey(text, ENCRYPTION_KEY);
        if (result !== null) return result;
    }

    // Fallback to LEGACY_ENCRYPTION_KEY for emails encrypted before key rotation
    if (LEGACY_ENCRYPTION_KEY) {
        const result = tryDecryptWithKey(text, LEGACY_ENCRYPTION_KEY);
        if (result !== null) return result;
    }

    console.error("Decryption failed with all available keys");
    return null;
}

export function maskEmail(email: string) {
    if (!email) return 'unknown';
    const [name, domain] = email.split('@');
    if (!domain) return email; // fallback
    const maskedName = name.length > 2 ? name.substring(0, 2) + '*'.repeat(name.length - 2) : name + '**';
    return `${maskedName}@${domain}`;
}
