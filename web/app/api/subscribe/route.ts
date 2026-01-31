import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import crypto from 'crypto';

// Simple AES encryption for demo
// In prod, manage keys with KMS or env vars
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 32 chars
const IV_LENGTH = 16;

function encryptEmail(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        // Encrypt
        const encryptedEmail = encryptEmail(email);

        // Save to Firestore
        await db.collection('subscribers').add({
            email: encryptedEmail,
            status: 'active',
            created_at: new Date(),
            source: 'web_landing'
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Subscription error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
