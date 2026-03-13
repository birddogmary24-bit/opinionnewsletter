import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';

const FALLBACK_CHANNELS: { opinion_leader: string; category: string }[] = [
    { opinion_leader: "김현정의 뉴스쇼", category: "정치" },
    { opinion_leader: "슈카월드", category: "정치" },
    { opinion_leader: "크랩 KLAB", category: "정치" },
    { opinion_leader: "스브스뉴스", category: "정치" },
    { opinion_leader: "YTN 돌발영상", category: "정치" },
    { opinion_leader: "삼프로TV", category: "경제" },
    { opinion_leader: "머니인사이드", category: "경제" },
    { opinion_leader: "박곰희TV", category: "경제" },
    { opinion_leader: "한경 코리아마켓", category: "경제" },
    { opinion_leader: "달란트투자", category: "경제" },
    { opinion_leader: "씨리얼 CeREEL", category: "사회" },
    { opinion_leader: "ODG", category: "사회" },
    { opinion_leader: "보따 BODA", category: "사회" },
    { opinion_leader: "희철리즘", category: "사회" },
    { opinion_leader: "헤이뉴스", category: "사회" },
    { opinion_leader: "월급쟁이부자들TV", category: "부동산" },
    { opinion_leader: "부읽남", category: "부동산" },
    { opinion_leader: "빠숑의 세상 답사기", category: "부동산" },
    { opinion_leader: "집코노미TV", category: "부동산" },
    { opinion_leader: "리얼캐스트TV", category: "부동산" },
    { opinion_leader: "ITSub잇섭", category: "IT" },
    { opinion_leader: "주연 ZUYONI", category: "IT" },
    { opinion_leader: "EO 이오", category: "IT" },
    { opinion_leader: "UNDERkg", category: "IT" },
    { opinion_leader: "뻘짓연구소", category: "IT" },
    { opinion_leader: "안될과학", category: "과학" },
    { opinion_leader: "긱블", category: "과학" },
    { opinion_leader: "과학드림", category: "과학" },
    { opinion_leader: "1분과학", category: "과학" },
    { opinion_leader: "에스오디 SOD", category: "과학" },
    { opinion_leader: "이동진의 파이아키아", category: "문화" },
    { opinion_leader: "셜록현준", category: "문화" },
    { opinion_leader: "조승연의 탐구생활", category: "문화" },
    { opinion_leader: "널 위한 문화예술", category: "문화" },
    { opinion_leader: "essential;", category: "문화" },
    { opinion_leader: "사물궁이 잡학지식", category: "지식" },
    { opinion_leader: "지식한입", category: "지식" },
    { opinion_leader: "교양만두", category: "지식" },
    { opinion_leader: "14F 일사에프", category: "지식" },
    { opinion_leader: "효짱", category: "지식" },
];

export async function GET() {
    try {
        // Look back 72 hours to ensure we cover enough channels
        const lookbackDate = new Date();
        lookbackDate.setHours(lookbackDate.getHours() - 72);

        const snapshot = await db.collection('contents')
            .where('scraped_at', '>=', lookbackDate)
            .orderBy('scraped_at', 'desc')
            .limit(200) // Fetch enough to deduplicate
            .get();

        const processedChannels = new Set();
        type ContentData = { id: string; opinion_leader?: string; scraped_at?: string; [key: string]: unknown; };
        const uniqueContents: ContentData[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const channel = data.opinion_leader;

            if (channel && !processedChannels.has(channel)) {
                processedChannels.add(channel);
                uniqueContents.push({
                    id: doc.id,
                    ...data,
                    scraped_at: data.scraped_at?.toDate().toISOString(),
                });
            }
        });

        // If Firestore has no recent data, use fallback channel list
        if (uniqueContents.length === 0) {
            const fallbackContents = FALLBACK_CHANNELS.map((ch, idx) => ({
                id: `fallback-${idx}`,
                opinion_leader: ch.opinion_leader,
                category: ch.category,
                title: ch.opinion_leader,
                url: '',
                thumbnail: '',
            }));
            return NextResponse.json({ contents: fallbackContents });
        }

        return NextResponse.json({ contents: uniqueContents });
    } catch (error) {
        console.error("Error fetching onboarding contents:", error);
        // Return fallback channels even on error so the page is never empty
        const fallbackContents = FALLBACK_CHANNELS.map((ch, idx) => ({
            id: `fallback-${idx}`,
            opinion_leader: ch.opinion_leader,
            category: ch.category,
            title: ch.opinion_leader,
            url: '',
            thumbnail: '',
        }));
        return NextResponse.json({ contents: fallbackContents });
    }
}
