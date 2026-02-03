import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';

export async function POST(request: Request) {
    try {
        const { subscriberId, selectedChannels, categories } = await request.json();

        if (!subscriberId) {
            return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
        }

        // Update subscriber document
        await db.collection('subscribers').doc(subscriberId).update({
            preferences: {
                channels: selectedChannels || [],
                categories: categories || [],
                updated_at: new Date()
            },
            onboarding_completed: true
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving preferences:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
