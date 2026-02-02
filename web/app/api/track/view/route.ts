import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { path, referrer } = body;

        await db.collection('tracking_events').add({
            type: 'pv',
            path: path || '/',
            referrer: referrer || '',
            timestamp: FieldValue.serverTimestamp(),
        });

        // Track in Amplitude
        const { trackAmplitudeEvent } = await import('@/lib/amplitude');
        await trackAmplitudeEvent('Web Page View', 'anonymous_web', {
            path: path || '/',
            referrer: referrer || ''
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
