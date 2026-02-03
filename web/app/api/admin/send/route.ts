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

        // 3. Determine Recipients (Array of objects now)
        interface Recipient {
            email: string;
            id: string;
            preferences?: {
                channels?: string[];
                categories?: string[];
            };
        }
        let recipients: Recipient[] = [];

        if (type === 'individual' && subscriberId) {
            const subDoc = await db.collection('subscribers').doc(subscriberId).get();
            if (subDoc.exists) {
                const data = subDoc.data();
                const dec = decryptEmail(data?.email);
                if (dec) {
                    recipients.push({
                        email: dec,
                        id: subDoc.id,
                        preferences: data?.preferences
                    });
                }
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
                    if (dec) {
                        recipients.push({
                            email: dec,
                            id: doc.id,
                            preferences: data.preferences
                        });
                    }
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
            open_count: 0,
            email_pv: 0,
            click_count: 0,
        });

        const mailId = mailHistoryRef.id;

        // 5. Configure Transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER || 'placeholder@gmail.com',
                pass: process.env.GMAIL_APP_PASSWORD || 'placeholder_password',
            },
        });

        // 6. Data Preparation Helper
        // Standard Top 3 (Fallback)
        const sortedByView = contents.sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0));
        const defaultTopStories = sortedByView.slice(0, 3);
        const remainingForCategories = sortedByView.slice(3);

        // Pre-calculate Helper for default categories
        const categoryStories: Record<string, any[]> = {};
        const categories = ['경제', '정치', '사회', '교육', '문화', 'IT/테크'];

        categories.forEach(category => {
            const categoryItems = remainingForCategories.filter((c: any) => {
                const text = `${c.opinion_leader} ${c.title}`.toLowerCase();
                return text.includes(category.toLowerCase());
            }).slice(0, 5);

            if (categoryItems.length > 0) {
                categoryStories[category] = categoryItems;
            }
        });

        // 7. Load Template
        const templatePath = path.join(process.cwd(), 'templates', 'email_daily.html');
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(templateSource);

        // 8. Send Emails
        if (!process.env.GMAIL_USER) {
            console.log("⚠️ Simulation Mode: Would send to", recipients.length, "recipients");
            return NextResponse.json({ success: true, count: recipients.length, simulated: true });
        }

        // Calculate KST date
        const now = new Date();
        const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const subjectDate = `${kstDate.getMonth() + 1}/${kstDate.getDate()}`;
        const trackingUrl = 'https://opinion-newsletter-web-810426728503.us-central1.run.app';

        const promises = recipients.map(recipient => {
            const sid = crypto.createHash('md5').update(recipient.email.toLowerCase()).digest('hex');

            // --- Personalization Logic ---
            let personalizedTopStories = defaultTopStories;

            // If user has preferred channels
            if (recipient.preferences?.channels && recipient.preferences.channels.length > 0) {
                const preferredChannels = new Set(recipient.preferences.channels);

                // Find all contents that match preferences
                const preferredContent = contents.filter((c: any) => preferredChannels.has(c.opinion_leader));

                // Sort preferred content by view count (or latest)
                preferredContent.sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0));

                // Construct the top 3: prioritize preferred, fill with default top
                const finalTop: any[] = [...preferredContent];

                // Prevent duplicates if we need to fill from default
                const usedIds = new Set(finalTop.map(c => c.url)); // using URL as unique ID if ID not available

                for (const item of sortedByView) {
                    if (finalTop.length >= 3) break;
                    if (!usedIds.has(item.url)) {
                        finalTop.push(item);
                        usedIds.add(item.url);
                    }
                }

                personalizedTopStories = finalTop.slice(0, 3);
            }
            // -----------------------------

            const personalizedHtml = template({
                contents: {
                    top_stories: personalizedTopStories,
                    category_stories: categoryStories // We keep categories standard for now, but top stories are personalized
                },
                mailId,
                sid,
                trackingUrl,
                date_str: new Date().toLocaleDateString('ko-KR')
            });

            return transporter.sendMail({
                from: `"오뉴 뉴스레터" <${process.env.GMAIL_USER}>`,
                to: recipient.email,
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
