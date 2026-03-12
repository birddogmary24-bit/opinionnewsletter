import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { encryptEmail, decryptEmail } from '../../../lib/crypto';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        const emailTrimmed = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailTrimmed || emailTrimmed.length > 254 || !emailRegex.test(emailTrimmed)) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        // Check for duplicate email
        const existingSubscribers = await db.collection('subscribers')
            .where('status', '==', 'active')
            .get();

        for (const doc of existingSubscribers.docs) {
            const decrypted = decryptEmail(doc.data().email);
            if (decrypted === emailTrimmed) {
                return NextResponse.json(
                    { error: 'Email already subscribed', code: 'DUPLICATE' },
                    { status: 409 }
                );
            }
        }

        // Encrypt
        const encryptedEmail = encryptEmail(emailTrimmed);

        // Save to Firestore
        const docRef = await db.collection('subscribers').add({
            email: encryptedEmail,
            status: 'active',
            is_test: false,
            created_at: new Date(),
            source: 'web_landing'
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error) {
        console.error("Subscription error:", error instanceof Error ? error.message : String(error));
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
