import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { encryptEmail } from '../../../lib/crypto';

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
            is_test: false,
            created_at: new Date(),
            source: 'web_landing'
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Subscription error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
