import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';

export async function GET() {
    try {
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const snapshot = await db.collection('contents')
            .where('scraped_at', '>=', yesterday)
            .get();

        let contentsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            scraped_at: doc.data().scraped_at?.toDate().toISOString(),
            published_at: doc.data().published_at,
            view_count: doc.data().view_count || 0
        }));

        // Sort by view_count DESC
        contentsList.sort((a: any, b: any) => b.view_count - a.view_count);

        // Limit to 30
        const contents = contentsList.slice(0, 30);

        return NextResponse.json({ contents });
    } catch (error) {
        console.error("Error fetching contents:", error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
