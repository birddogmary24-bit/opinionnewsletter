import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mailId = searchParams.get('id');

    if (mailId) {
        try {
            // 1. Log the open event in a detailed tracking collection
            await db.collection('tracking_events').add({
                type: 'open',
                mailId,
                timestamp: FieldValue.serverTimestamp(),
            });

            // 2. Increment the open_count in the mail_history
            await db.collection('mail_history').doc(mailId).update({
                open_count: FieldValue.increment(1)
            });
        } catch (error) {
            console.error("Tracking Error:", error);
        }
    }

    // Return a 1x1 transparent tracking pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return new NextResponse(pixel, {
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
