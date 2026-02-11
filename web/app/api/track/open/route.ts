import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

function hashPII(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mailId = searchParams.get('id');

    if (mailId) {
        try {
            const ip = request.headers.get('x-forwarded-for') || 'unknown';
            const ua = request.headers.get('user-agent') || 'unknown';
            const ipHash = hashPII(ip);
            const uaHash = hashPII(ua);

            // 1. Always record Email PV (Page View for the Email)
            await db.collection('tracking_events').add({
                type: 'email_pv',
                mailId,
                ipHash,
                uaHash,
                timestamp: FieldValue.serverTimestamp(),
            });

            // Increment email_pv in mail_history
            await db.collection('mail_history').doc(mailId).update({
                email_pv: FieldValue.increment(1)
            });

            const sid = searchParams.get('sid');

            // 2. Check for Unique Open (UV)
            const identity = sid || crypto.createHash('sha256').update(ip + ua).digest('hex').substring(0, 32);
            const uvId = `${mailId}_${identity}`;

            const uvRef = db.collection('unique_opens').doc(uvId);
            const uvDoc = await uvRef.get();

            if (!uvDoc.exists) {
                await uvRef.set({
                    mailId,
                    ipHash,
                    timestamp: FieldValue.serverTimestamp(),
                });

                await db.collection('tracking_events').add({
                    type: 'open',
                    mailId,
                    ipHash,
                    uaHash,
                    timestamp: FieldValue.serverTimestamp(),
                });

                await db.collection('mail_history').doc(mailId).update({
                    open_count: FieldValue.increment(1)
                });

                // Track in Amplitude (without PII)
                const { trackAmplitudeEvent } = await import('@/lib/amplitude');
                await trackAmplitudeEvent('Email Open', identity, {
                    mailId,
                    sid: sid || 'none',
                });
            }
        } catch (error) {
            console.error("Tracking Error");
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
