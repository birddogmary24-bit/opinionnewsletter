import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';

export async function GET() {
    try {
        // Try last 24h first, fallback to 7 days if no content found
        const thresholds = [24, 48, 168]; // hours: 1d, 2d, 7d
        let contentsList: any[] = [];

        for (const hours of thresholds) {
            const threshold = new Date();
            threshold.setHours(threshold.getHours() - hours);

            const snapshot = await db.collection('contents')
                .where('scraped_at', '>=', threshold)
                .get();

            contentsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                scraped_at: doc.data().scraped_at?.toDate().toISOString(),
                published_at: doc.data().published_at,
                view_count: doc.data().view_count || 0
            }));

            if (contentsList.length > 0) break;
        }

        // Sort by view_count DESC
        contentsList.sort((a: any, b: any) => b.view_count - a.view_count);

        // Limit to 30
        const contents = contentsList.slice(0, 30);

        return NextResponse.json({ contents });
    } catch (error) {
        console.error("Error fetching contents");
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
