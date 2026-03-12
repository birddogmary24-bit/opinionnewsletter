import { NextResponse } from 'next/server';
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

/**
 * Cloud Scheduler 전용 자동 발송 엔드포인트
 *
 * 인증: CRON_SECRET 헤더 기반 (admin 세션 불필요)
 *
 * Cloud Scheduler 설정:
 *   URL: https://your-domain/api/cron/send
 *   Method: POST
 *   Headers: { "x-cron-secret": "your-cron-secret-value" }
 *   Schedule: 0 7 * * * (Asia/Seoul)
 */
export async function POST(request: Request) {
    try {
        // 1. Secret Key 인증
        const cronSecret = request.headers.get('x-cron-secret');
        if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Gmail 설정 확인
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.error('Cron send: GMAIL_USER or GMAIL_APP_PASSWORD not configured');
            return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
        }

        // 3. 콘텐츠 가져오기 (24시간 이내, 최대 30개)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const contentSnapshot = await db.collection('contents')
            .where('scraped_at', '>=', oneDayAgo)
            .orderBy('scraped_at', 'desc')
            .limit(30)
            .get();

        type ContentItem = { view_count?: number; opinion_leader?: string; title?: string; url?: string; [key: string]: unknown; };
        const contents = contentSnapshot.docs.map(d => d.data()) as ContentItem[];

        if (contents.length === 0) {
            return NextResponse.json({ success: true, message: 'No content to send', count: 0 });
        }

        // 4. 활성 구독자 가져오기 (테스트 제외)
        const subSnapshot = await db.collection('subscribers')
            .where('status', '==', 'active')
            .get();

        interface Recipient {
            email: string;
            id: string;
            preferences?: {
                channels?: string[];
                categories?: string[];
            };
        }

        const recipients: Recipient[] = [];
        subSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.is_test === true) return; // 테스트 구독자 제외

            const dec = decryptEmail(data.email);
            if (dec) {
                recipients.push({
                    email: dec,
                    id: doc.id,
                    preferences: data.preferences
                });
            }
        });

        if (recipients.length === 0) {
            return NextResponse.json({ success: true, message: 'No recipients', count: 0 });
        }

        // 5. mail_history 생성
        const mailHistoryRef = await db.collection('mail_history').add({
            sent_at: new Date().toISOString(),
            type: 'all',
            recipient_count: recipients.length,
            status: 'success',
            simulated: false,
            open_count: 0,
            email_pv: 0,
            click_count: 0,
            trigger: 'cron',
        });

        const mailId = mailHistoryRef.id;

        // 6. Nodemailer 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        // 7. 콘텐츠 정렬 및 분류
        const sortedByView = contents.sort((a, b) => ((b.view_count as number) || 0) - ((a.view_count as number) || 0));
        const defaultTopStories = sortedByView.slice(0, 3);
        const remainingForCategories = sortedByView.slice(3);

        const categoryStories: Record<string, ContentItem[]> = {};
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

        // 8. 템플릿 로드
        const templatePath = path.join(process.cwd(), 'templates', 'email_daily.html');
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(templateSource);

        // 9. 이메일 발송
        const now = new Date();
        const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const subjectDate = `${kstDate.getMonth() + 1}/${kstDate.getDate()}`;
        const trackingUrl = 'https://opinionnewsletter-web-810426728503.asia-northeast3.run.app';

        let successCount = 0;
        let failCount = 0;

        const promises = recipients.map(async (recipient) => {
            try {
                const sid = crypto.createHash('md5').update(recipient.email.toLowerCase()).digest('hex');

                // 개인화된 Top 3
                let personalizedTopStories = defaultTopStories;
                if (recipient.preferences?.channels && recipient.preferences.channels.length > 0) {
                    const preferredChannels = new Set(recipient.preferences.channels);
                    const preferredContent = contents
                        .filter((c: any) => preferredChannels.has(c.opinion_leader))
                        .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0));

                    const finalTop: any[] = [...preferredContent];
                    const usedIds = new Set(finalTop.map(c => c.url));

                    for (const item of sortedByView) {
                        if (finalTop.length >= 3) break;
                        if (!usedIds.has(item.url)) {
                            finalTop.push(item);
                            usedIds.add(item.url);
                        }
                    }
                    personalizedTopStories = finalTop.slice(0, 3);
                }

                const personalizedHtml = template({
                    contents: {
                        top_stories: personalizedTopStories,
                        category_stories: categoryStories
                    },
                    mailId,
                    sid,
                    trackingUrl,
                    date_str: new Date().toLocaleDateString('ko-KR')
                });

                await transporter.sendMail({
                    from: `"오뉴 뉴스레터" <${process.env.GMAIL_USER}>`,
                    to: recipient.email,
                    subject: `오뉴 - 오늘의 오피니언 뉴스 [${subjectDate}]`,
                    html: personalizedHtml,
                });

                successCount++;
            } catch (e) {
                failCount++;
                console.error(`Cron send failed for ${recipient.id}:`, e instanceof Error ? e.message : String(e));
            }
        });

        await Promise.allSettled(promises);

        // 10. 결과 업데이트
        await mailHistoryRef.update({
            status: failCount === recipients.length ? 'error' : 'success',
            error_message: failCount > 0 ? `${failCount}/${recipients.length} failed` : undefined,
        });

        console.log(`Cron send complete: ${successCount} success, ${failCount} failed out of ${recipients.length}`);

        return NextResponse.json({
            success: true,
            count: successCount,
            failed: failCount,
            total: recipients.length,
            mailId,
        });

    } catch (error) {
        console.error("Cron send error:", error instanceof Error ? error.message : String(error));
        try {
            await db.collection('mail_history').add({
                sent_at: new Date().toISOString(),
                type: 'error',
                recipient_count: 0,
                status: 'error',
                error_message: String(error),
                trigger: 'cron',
            });
        } catch (e) { }
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    }
}
