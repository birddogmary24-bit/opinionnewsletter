import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';

export async function GET() {
    try {
        // Look back 72 hours to ensure we cover enough channels
        const lookbackDate = new Date();
        lookbackDate.setHours(lookbackDate.getHours() - 72);

        const snapshot = await db.collection('contents')
            .where('scraped_at', '>=', lookbackDate)
            .orderBy('scraped_at', 'desc')
            .limit(200) // Fetch enough to deduplicate
            .get();

        const processedChannels = new Set();
        const uniqueContents: any[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const channel = data.opinion_leader;

            if (channel && !processedChannels.has(channel)) {
                processedChannels.add(channel);
                uniqueContents.push({
                    id: doc.id,
                    ...data,
                    scraped_at: data.scraped_at?.toDate().toISOString(),
                });
            }
        });

        return NextResponse.json({ contents: uniqueContents });
    } catch (error) {
        console.error("Error fetching onboarding contents:", error);
        return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 });
    }
}
