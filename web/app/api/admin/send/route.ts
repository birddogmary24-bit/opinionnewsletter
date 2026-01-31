import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import { decryptEmail } from '@/lib/crypto';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        // 1. Auth Check
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');
        if (session?.value !== 'authenticated') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, subscriberId } = body; // type: 'all' | 'individual'

        // 2. Fetch Content (Mocking fetching 'today's' content for now, or just send a welcome email)
        // Ideally we fetch from 'contents' collection. Let's do a simple fetch.
        const contentSnapshot = await db.collection('contents').orderBy('scraped_at', 'desc').limit(5).get();
        const contents = contentSnapshot.docs.map(d => d.data());

        // 3. Determine Recipients
        let recipients: string[] = [];

        if (type === 'individual' && subscriberId) {
            const subDoc = await db.collection('subscribers').doc(subscriberId).get();
            if (subDoc.exists) {
                const dec = decryptEmail(subDoc.data()?.email);
                if (dec) recipients.push(dec);
            }
        } else if (type === 'all') {
            const subSnapshot = await db.collection('subscribers').where('status', '==', 'active').get();
            subSnapshot.docs.forEach(doc => {
                const dec = decryptEmail(doc.data().email);
                if (dec) recipients.push(dec);
            });
        }

        if (recipients.length === 0) {
            return NextResponse.json({ success: false, message: 'No valid recipients found' });
        }

        // 4. Configure Transporter
        // NOTE: User needs to set these ENV vars in Cloud Run!
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER || 'placeholder@gmail.com', // User needs to set this
                pass: process.env.GMAIL_APP_PASSWORD || 'placeholder_password',
            },
        });

        // 5. Send Emails
        // For MVP, sending sequentially. For scale, use a queue.
        const currDate = new Date().toLocaleDateString('ko-KR');

        // Simple HTML Template
        const htmlContent = `
            <div style="font-family: serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
                <div style="text-align: center; padding: 20px; border-bottom: 1px solid #e2e8f0;">
                    <h1 style="margin:0; font-size: 24px;">ONEW</h1>
                    <p style="font-size: 12px; color: #718096;">${currDate}</p>
                </div>
                <div style="padding: 20px;">
                    <h2>Most Read Today</h2>
                    ${contents.length > 0 ? contents.map((c: any) => `
                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 5px 0;">${c.title}</h3>
                            <p style="margin: 0; color: #4a5568; font-size: 14px;">${c.opinion_leader} • ${c.description?.substring(0, 100)}...</p>
                            <a href="${c.url}" style="color: #2b6cb0; font-size: 12px;">Read More</a>
                        </div>
                    `).join('') : '<p>No new updates today.</p>'}
                </div>
                <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096;">
                    <p>Unless you are subscribed, ignore this email.</p>
                </div>
            </div>
        `;

        // If no credentials are set, we simulate per request
        if (!process.env.GMAIL_USER) {
            console.log("⚠️ Simulation Mode: Would send to", recipients.length, "recipients");
            // Return success for UI demo even if not actually sent
            return NextResponse.json({ success: true, count: recipients.length, simulated: true });
        }

        const promises = recipients.map(to => {
            return transporter.sendMail({
                from: `"ONEW Newsletter" <${process.env.GMAIL_USER}>`,
                to,
                subject: `ONEW Daily Briefing - ${currDate}`,
                html: htmlContent,
            });
        });

        await Promise.allSettled(promises);

        // 6. Log History
        await db.collection('mail_history').add({
            sent_at: new Date().toISOString(),
            type,
            recipient_count: recipients.length,
            status: 'success',
            simulated: !process.env.GMAIL_USER
        });

        return NextResponse.json({ success: true, count: recipients.length });

    } catch (error) {
        console.error("Sending error:", error);
        // Log Error also
        try {
            await db.collection('mail_history').add({
                sent_at: new Date().toISOString(),
                type: 'error',
                recipient_count: 0,
                status: 'error',
                error_message: String(error)
            });
        } catch (e) { }
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    }
}
