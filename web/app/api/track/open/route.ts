import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mailId = searchParams.get('id');

    if (mailId) {
        try {
            const ip = request.headers.get('x-forwarded-for') || 'unknown';
            const ua = request.headers.get('user-agent') || 'unknown';

            // Simplified query to avoid index errors (only using mailId)
            // We'll filter by IP/UA in JS
            const recentOpens = await db.collection('tracking_events')
                .where('mailId', '==', mailId)
                .where('type', '==', 'open')
                .limit(10) // Get last 10 (without order, but usually fine for recent)
                .get();

            let shouldTrack = true;
            const now = Date.now();

            recentOpens.docs.forEach(doc => {
                const data = doc.data();
                if (data.ip === ip && data.ua === ua && data.timestamp) {
                    const lastTime = data.timestamp.toDate().getTime();
                    if (now - lastTime < 3000) { // 3 second window
                        shouldTrack = false;
                    }
                }
            });

            if (shouldTrack) {
                // 1. Log the open event in a detailed tracking collection
                await db.collection('tracking_events').add({
                    type: 'open',
                    mailId,
                    ip,
                    ua,
                    timestamp: FieldValue.serverTimestamp(),
                });

                // 2. Increment the open_count in the mail_history
                await db.collection('mail_history').doc(mailId).update({
                    open_count: FieldValue.increment(1)
                });
            }
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
