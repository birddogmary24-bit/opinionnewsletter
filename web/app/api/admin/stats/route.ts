import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        if (session?.value !== 'authenticated') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch send logs
        const logsSnapshot = await db.collection('mail_history').orderBy('sent_at', 'desc').limit(100).get();
        const history = logsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                sent_at: data.sent_at,
                type: data.type,
                recipient_count: data.recipient_count,
                status: data.status,
                simulated: data.simulated
            };
        });

        // 2. Aggregate for chart (Daily volume)
        const dailyVolumes: { [date: string]: number } = {};

        // Let's get last 7 days for the chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        history.forEach(log => {
            if (log.sent_at) {
                const dateStr = log.sent_at.split('T')[0];
                if (new Date(log.sent_at) >= sevenDaysAgo) {
                    dailyVolumes[dateStr] = (dailyVolumes[dateStr] || 0) + (Number(log.recipient_count) || 0);
                }
            }
        });

        // Format as array for Recharts
        const chartData = Object.keys(dailyVolumes)
            .sort()
            .map(date => ({
                date,
                count: dailyVolumes[date]
            }));

        // 3. System Quota (Today's count)
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const todayKST = new Date(now.getTime() + kstOffset).toISOString().split('T')[0];

        let todayCount = 0;
        history.forEach(log => {
            if (log.sent_at) {
                const logKST = new Date(new Date(log.sent_at).getTime() + kstOffset).toISOString().split('T')[0];
                if (logKST === todayKST && log.status === 'success') {
                    todayCount += (Number(log.recipient_count) || 0);
                }
            }
        });

        return NextResponse.json({
            history,
            chartData,
            quota: {
                todayCount,
                limit: 500,
                sender: process.env.GMAIL_USER || 'birddogmary24@gmail.com'
            }
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
