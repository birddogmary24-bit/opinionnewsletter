import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import { decryptEmail, maskEmail } from '@/lib/crypto';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        if (session?.value !== 'authenticated') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch subscribers from Firestore
        const snapshot = await db.collection('subscribers').orderBy('created_at', 'desc').get();
        const subscribers = snapshot.docs.map(doc => {
            const data = doc.data();
            // Decrypt real email
            const realEmail = decryptEmail(data.email);
            // Mask for frontend
            const masked = maskEmail(realEmail || 'error');

            return {
                id: doc.id,
                ...data,
                email: masked, // Send ONLY masked email
                created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : null,
            };
        });

        return NextResponse.json({ subscribers });
    } catch (error) {
        console.error("Error fetching subscribers:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
