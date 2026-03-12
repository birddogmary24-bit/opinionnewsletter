import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { decryptEmail } from '@/lib/crypto';
import crypto from 'crypto';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sid = searchParams.get('sid');

    if (!sid) {
        return new NextResponse('잘못된 요청입니다.', { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    try {
        // SID = MD5(email) 로 구독자 찾기
        const snapshot = await db.collection('subscribers').where('status', '==', 'active').get();

        let foundId: string | null = null;
        for (const doc of snapshot.docs) {
            const decrypted = decryptEmail(doc.data().email);
            if (decrypted) {
                const hash = crypto.createHash('md5').update(decrypted.toLowerCase()).digest('hex');
                if (hash === sid) {
                    foundId = doc.id;
                    break;
                }
            }
        }

        if (!foundId) {
            return new NextResponse(
                `<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#020617;color:#94a3b8;">
                    <h2 style="color:#f1f5f9;">이미 수신거부 처리되었거나 존재하지 않는 이메일입니다.</h2>
                </body></html>`,
                { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
        }

        await db.collection('subscribers').doc(foundId).update({ status: 'inactive' });

        return new NextResponse(
            `<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#020617;color:#94a3b8;">
                <h2 style="color:#f1f5f9;">수신거부가 완료되었습니다.</h2>
                <p>오뉴 뉴스레터 수신이 중단되었습니다.<br>다시 구독하려면 웹사이트를 방문해주세요.</p>
            </body></html>`,
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    } catch (error) {
        console.error('Unsubscribe error:', error instanceof Error ? error.message : String(error));
        return new NextResponse('처리 중 오류가 발생했습니다.', { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
}
