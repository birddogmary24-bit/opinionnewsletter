import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';

export async function POST(request: Request) {
    try {
        const { subscriberId, selectedChannels, categories } = await request.json();

        if (!subscriberId || typeof subscriberId !== 'string' || subscriberId.length > 128) {
            return NextResponse.json({ error: 'Invalid Subscriber ID' }, { status: 400 });
        }

        // Validate arrays
        const channels = Array.isArray(selectedChannels) ? selectedChannels.filter((c: unknown) => typeof c === 'string').slice(0, 50) : [];
        const cats = Array.isArray(categories) ? categories.filter((c: unknown) => typeof c === 'string').slice(0, 20) : [];

        // Update subscriber document
        await db.collection('subscribers').doc(subscriberId).update({
            preferences: {
                channels,
                categories: cats,
                updated_at: new Date()
            },
            onboarding_completed: true
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving preferences");
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
