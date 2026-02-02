import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const mailId = searchParams.get('id');
    const target = searchParams.get('target') || 'article';

    if (url) {
        try {
            // 1. Log the click event in the general tracking_events collection
            await db.collection('tracking_events').add({
                type: 'click',
                mailId: mailId || null, // Optional for web clicks
                target,
                url,
                timestamp: FieldValue.serverTimestamp(),
            });

            // 2. Increment the click_count in the mail_history if mailId is present (Email clicks)
            if (mailId) {
                await db.collection('mail_history').doc(mailId).update({
                    click_count: FieldValue.increment(1)
                });
            }

            // Track in Amplitude
            const { trackAmplitudeEvent } = await import('@/lib/amplitude');
            const sid = searchParams.get('sid');
            const ip = request.headers.get('x-forwarded-for') || 'unknown';
            const identity = sid || Buffer.from(ip).toString('base64').substring(0, 50);

            await trackAmplitudeEvent('Link Click', identity, {
                mailId: mailId || 'web',
                url,
                target,
                sid: sid || 'none'
            });
        } catch (error) {
            console.error("Click Tracking Error:", error);
        }
    }

    // Redirect to the original URL
    if (url) {
        try {
            return NextResponse.redirect(new URL(url));
        } catch (e) {
            // Fallback for relative or malformed URLs that work as strings
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
}
