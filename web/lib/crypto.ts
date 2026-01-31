import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 32 chars
const IV_LENGTH = 16;

export function encryptEmail(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptEmail(text: string) {
    if (!text.includes(':')) return text; // Helper for legacy/plaintext
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error("Decryption failed", e);
        return null; // Or return original text if we assume mixed data
    }
}

export function maskEmail(email: string) {
    if (!email) return 'unknown';
    const [name, domain] = email.split('@');
    if (!domain) return email; // fallback
    const maskedName = name.length > 2 ? name.substring(0, 2) + '*'.repeat(name.length - 2) : name + '**';
    return `${maskedName}@${domain}`;
}
