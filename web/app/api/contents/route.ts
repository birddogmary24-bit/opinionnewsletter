import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';

export async function GET() {
    try {
        const snapshot = await db.collection('contents')
            .orderBy('scraped_at', 'desc')
            .limit(6)
            .get();

        const contents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Timestamp to ISO string for serialization
            scraped_at: doc.data().scraped_at?.toDate().toISOString(),
            published_at: doc.data().published_at // already string or handle if timestamp
        }));

        return NextResponse.json({ contents });
    } catch (error) {
        console.error("Error fetching contents:", error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
