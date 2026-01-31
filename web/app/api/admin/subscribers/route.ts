import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        if (session?.value !== 'authenticated') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch subscribers from Firestore
        const snapshot = await db.collection('subscribers').orderBy('created_at', 'desc').get();
        const subscribers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure dates are serializable
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate().toISOString() : null,
        }));

        return NextResponse.json({ subscribers });
    } catch (error) {
        console.error("Error fetching subscribers:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
