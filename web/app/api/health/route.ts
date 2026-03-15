import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import fs from 'fs';
import path from 'path';

/**
 * 헬스체크 엔드포인트
 * 브라우저에서 /api/health 접속하면 모든 설정 상태를 확인할 수 있습니다.
 */
export async function GET() {
    const checks: Record<string, { status: string; message: string }> = {};

    // 1. 환경변수 체크
    checks['GMAIL_USER'] = process.env.GMAIL_USER
        ? { status: 'ok', message: `설정됨 (${process.env.GMAIL_USER})` }
        : { status: 'error', message: '미설정 - 이메일 발송 불가' };

    checks['GMAIL_APP_PASSWORD'] = process.env.GMAIL_APP_PASSWORD
        ? { status: 'ok', message: '설정됨' }
        : { status: 'error', message: '미설정 - 이메일 발송 불가' };

    checks['ENCRYPTION_KEY'] = process.env.ENCRYPTION_KEY
        ? (process.env.ENCRYPTION_KEY.length === 32
            ? { status: 'ok', message: '설정됨 (32자)' }
            : { status: 'error', message: `길이 오류: ${process.env.ENCRYPTION_KEY.length}자 (32자 필요)` })
        : { status: 'error', message: '미설정 - 구독 기능 불가' };

    checks['ADMIN_PASSWORD'] = process.env.ADMIN_PASSWORD
        ? { status: 'ok', message: '설정됨' }
        : { status: 'warning', message: '미설정 - 관리자 로그인 불가' };

    checks['CRON_SECRET'] = process.env.CRON_SECRET
        ? { status: 'ok', message: '설정됨' }
        : { status: 'warning', message: '미설정 - 자동 발송 불가' };

    // 2. Firebase 연결 체크
    try {
        const testSnapshot = await db.collection('subscribers').limit(1).get();
        checks['Firebase'] = {
            status: 'ok',
            message: `연결 성공 (subscribers: ${testSnapshot.size >= 1 ? '데이터 있음' : '비어있음'})`
        };
    } catch (e) {
        checks['Firebase'] = {
            status: 'error',
            message: `연결 실패: ${e instanceof Error ? e.message : String(e)}`
        };
    }

    // 3. 이메일 템플릿 체크
    const templatePath = path.join(process.cwd(), 'templates', 'email_daily.html');
    try {
        fs.accessSync(templatePath, fs.constants.R_OK);
        checks['Email Template'] = { status: 'ok', message: '템플릿 파일 존재' };
    } catch {
        checks['Email Template'] = { status: 'error', message: '템플릿 파일 없음 - 이메일 발송 불가 (Dockerfile 확인 필요)' };
    }

    // 4. 구독자 수 체크
    try {
        const activeCount = await db.collection('subscribers').where('status', '==', 'active').count().get();
        checks['Active Subscribers'] = {
            status: 'ok',
            message: `${activeCount.data().count}명`
        };
    } catch {
        checks['Active Subscribers'] = { status: 'warning', message: '조회 실패' };
    }

    // 5. 콘텐츠 freshness 체크 (크롤러 장애 조기 감지)
    try {
        const latestContent = await db.collection('contents')
            .orderBy('scraped_at', 'desc')
            .limit(1)
            .get();

        if (latestContent.empty) {
            checks['Content Freshness'] = { status: 'error', message: '콘텐츠 없음 — 크롤러 미실행' };
        } else {
            const latestData = latestContent.docs[0].data();
            const scrapedAt = latestData.scraped_at?.toDate?.() ?? new Date(latestData.scraped_at);
            const hoursAgo = (Date.now() - scrapedAt.getTime()) / (1000 * 60 * 60);

            if (hoursAgo > 48) {
                checks['Content Freshness'] = {
                    status: 'error',
                    message: `마지막 크롤링 ${Math.floor(hoursAgo)}시간 전 — 크롤러 장애 의심`
                };
            } else if (hoursAgo > 25) {
                checks['Content Freshness'] = {
                    status: 'warning',
                    message: `마지막 크롤링 ${Math.floor(hoursAgo)}시간 전`
                };
            } else {
                checks['Content Freshness'] = {
                    status: 'ok',
                    message: `마지막 크롤링 ${Math.floor(hoursAgo)}시간 전`
                };
            }
        }
    } catch {
        checks['Content Freshness'] = { status: 'warning', message: '콘텐츠 freshness 조회 실패' };
    }

    // 전체 상태 판단
    const hasError = Object.values(checks).some(c => c.status === 'error');
    const hasWarning = Object.values(checks).some(c => c.status === 'warning');

    return NextResponse.json({
        overall: hasError ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy',
        checks,
        timestamp: new Date().toISOString(),
    }, { status: hasError ? 503 : 200 });
}
