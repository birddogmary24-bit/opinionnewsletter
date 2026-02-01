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

            // 1. Always record Email PV (Page View for the Email)
            await db.collection('tracking_events').add({
                type: 'email_pv',
                mailId,
                ip,
                ua,
                timestamp: FieldValue.serverTimestamp(),
            });

            // Increment email_pv in mail_history
            await db.collection('mail_history').doc(mailId).update({
                email_pv: FieldValue.increment(1)
            });

            const sid = searchParams.get('sid');

            // 2. Check for Unique Open (UV) 
            // If sid (Subscriber ID) is provided, use it for a perfect UV.
            // If not (e.g. legacy or web), fallback to IP+UA hash.
            const identity = sid || Buffer.from(ip + ua).toString('base64').substring(0, 50).replace(/\//g, '_');
            const uvId = `${mailId}_${identity}`;

            const uvRef = db.collection('unique_opens').doc(uvId);
            const uvDoc = await uvRef.get();

            if (!uvDoc.exists) {
                // First time this IP/UA opens this mail
                await uvRef.set({
                    mailId,
                    ip,
                    timestamp: FieldValue.serverTimestamp(),
                });

                // Also log to tracking_events for history
                await db.collection('tracking_events').add({
                    type: 'open',
                    mailId,
                    ip,
                    ua,
                    timestamp: FieldValue.serverTimestamp(),
                });

                // Increment open_count (which now represents UV)
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
