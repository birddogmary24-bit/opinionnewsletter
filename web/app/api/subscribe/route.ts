import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { encryptEmail } from '../../../lib/crypto';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        const emailTrimmed = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailTrimmed || emailTrimmed.length > 254 || !emailRegex.test(emailTrimmed)) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
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
        console.error("Subscription error");
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
