import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const mailId = searchParams.get('id');
    const target = searchParams.get('target') || 'article';

    if (mailId && url) {
        try {
            // 1. Log the click event
            await db.collection('tracking_events').add({
                type: 'click',
                mailId,
                target,
                url,
                timestamp: FieldValue.serverTimestamp(),
            });

            // 2. Increment the click_count in the mail_history
            await db.collection('mail_history').doc(mailId).update({
                click_count: FieldValue.increment(1)
            });
        } catch (error) {
            console.error("Click Tracking Error:", error);
        }
    }

    // Redirect to the original URL
    if (url) {
        return NextResponse.redirect(new URL(url));
    }

    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
}
