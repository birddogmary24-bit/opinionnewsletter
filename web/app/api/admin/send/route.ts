import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import { decryptEmail } from '@/lib/crypto';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import crypto from 'crypto';

// Register Handlebars helpers
Handlebars.registerHelper('encodeURL', function (url: string) {
    return encodeURIComponent(url);
});

Handlebars.registerHelper('formatNumber', function (num: number) {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString('ko-KR');
});

export async function POST(request: Request) {
    try {
        // 1. Auth Check
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');
        if (session?.value !== 'authenticated') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, subscriberId, targetGroup } = body; // type: 'all' | 'individual' | 'group', targetGroup: 'test' | 'production' | 'all'

        // 2. Fetch Content (최대 30개, 24시간 이내 데이터)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const contentSnapshot = await db.collection('contents')
            .where('scraped_at', '>=', oneDayAgo)
            .orderBy('scraped_at', 'desc')
            .limit(30)
            .get();

        const contents = contentSnapshot.docs.map(d => d.data());

        // 3. Determine Recipients
        let recipients: string[] = [];

        if (type === 'individual' && subscriberId) {
            const subDoc = await db.collection('subscribers').doc(subscriberId).get();
            if (subDoc.exists) {
                const dec = decryptEmail(subDoc.data()?.email);
                if (dec) recipients.push(dec);
            }
        } else if (type === 'group' || type === 'all') {
            const subSnapshot = await db.collection('subscribers').where('status', '==', 'active').get();
            subSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const isTest = data.is_test === true;

                let shouldAdd = false;
                if (targetGroup === 'test' && isTest) shouldAdd = true;
                else if (targetGroup === 'production' && !isTest) shouldAdd = true;
                else if (!targetGroup || targetGroup === 'all') shouldAdd = true;

                if (shouldAdd) {
                    const dec = decryptEmail(data.email);
                    if (dec) recipients.push(dec);
                }
            });
        }

        if (recipients.length === 0) {
            return NextResponse.json({ success: false, message: 'No valid recipients found' });
        }

        // 4. Create mail_history entry first to get mail_id
        const mailHistoryRef = await db.collection('mail_history').add({
            sent_at: new Date().toISOString(),
            type,
            recipient_count: recipients.length,
            status: 'success',
            simulated: !process.env.GMAIL_USER,
            open_count: 0,      // Unique Opens (UV)
            email_pv: 0,        // Total Page Views (PV)
            click_count: 0,     // Initialize tracking counters
        });

        const mailId = mailHistoryRef.id;  // Extract Firestore-generated ID

        // 5. Configure Transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER || 'placeholder@gmail.com',
                pass: process.env.GMAIL_APP_PASSWORD || 'placeholder_password',
            },
        });

        // 6. Prepare Template Data
        // Top 3 stories by view_count
        const topStories = contents
            .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 3);

        // Category-based stories
        // For demo, we'll group remaining items by opinion_leader or category field
        // Adjust this logic based on your actual data structure
        const categoryStories: Record<string, any[]> = {};
        const categories = ['경제', '정치', '사회', '교육', '문화', 'IT/테크'];

        // Simple categorization: if opinion_leader or title contains category keyword
        const remainingContents = contents.slice(3); // Skip top 3

        categories.forEach(category => {
            const categoryItems = remainingContents.filter((c: any) => {
                const text = `${c.opinion_leader} ${c.title}`.toLowerCase();
                return text.includes(category.toLowerCase());
            }).slice(0, 5); // Max 5 per category

            if (categoryItems.length > 0) {
                categoryStories[category] = categoryItems;
            }
        });

        // 7. Load and Render Template
        const templatePath = path.join(process.cwd(), 'templates', 'email_daily.html');
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(templateSource);

        // 8. Send Emails
        // If no credentials are set, we simulate
        if (!process.env.GMAIL_USER) {
            console.log("⚠️ Simulation Mode: Would send to", recipients.length, "recipients");
            return NextResponse.json({ success: true, count: recipients.length, simulated: true });
        }

        // Calculate KST date (UTC+9)
        const now = new Date();
        const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const subjectDate = `${kstDate.getMonth() + 1}/${kstDate.getDate()}`;

        const trackingUrl = 'https://opinion-newsletter-web-810426728503.us-central1.run.app';

        const promises = recipients.map(to => {
            // Generate unique SID for this recipient (hashed email)
            const sid = crypto.createHash('md5').update(to.toLowerCase()).digest('hex');

            const personalizedHtml = template({
                contents: {
                    top_stories: topStories,
                    category_stories: categoryStories
                },
                mailId,
                sid,
                trackingUrl,
                date_str: new Date().toLocaleDateString('ko-KR')
            });

            return transporter.sendMail({
                from: `"오뉴 뉴스레터" <${process.env.GMAIL_USER}>`,
                to,
                subject: `오뉴 - 오늘의 오피니언 뉴스 [${subjectDate}]`,
                html: personalizedHtml,
            });
        });

        await Promise.allSettled(promises);

        return NextResponse.json({ success: true, count: recipients.length });

    } catch (error) {
        console.error("Sending error:", error);
        // Log Error
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
