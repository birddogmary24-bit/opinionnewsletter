'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Mail, RefreshCw, LogOut, CheckCircle, AlertCircle, Loader2, BarChart3, History, Trash2, SendHorizontal, Layout, MousePointer2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Subscriber {
    id: string;
    email: string;
    created_at: string;
    status: string;
}

interface MailLog {
    id: string;
    sent_at: string;
    type: string;
    recipient_count: number;
    status: string;
    simulated?: boolean;
    open_count?: number;
    click_count?: number;
}

interface WebStat {
    pv: number;
    clicks: number;
}

interface Quota {
    todayCount: number;
    limit: number;
    sender: string;
}

export default function AdminDashboard() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [history, setHistory] = useState<MailLog[]>([]);
    const [webStats, setWebStats] = useState<Record<string, WebStat>>({});
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0 });
    const [quota, setQuota] = useState<Quota | null>(null);
    const [activeTab, setActiveTab] = useState<'subscribers' | 'stats' | 'history'>('stats');
    const router = useRouter();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([fetchSubscribers(), fetchStatusData()]);
        setLoading(false);
    };

    const fetchSubscribers = async () => {
        try {
            const res = await fetch('/api/admin/subscribers');
            if (res.status === 401) {
                router.push('/admin');
                return;
            }
            const data = await res.json();
            if (data.subscribers) {
                setSubscribers(data.subscribers);
                setStats({
                    total: data.subscribers.length,
                    active: data.subscribers.filter((s: any) => s.status === 'active').length
                });
            }
        } catch (error) {
            console.error('Failed to fetch subscribers');
        }
    };

    const fetchStatusData = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            if (data.history) setHistory(data.history);
            if (data.chartData) setChartData(data.chartData);
            if (data.webStats) setWebStats(data.webStats);
            if (data.quota) setQuota(data.quota);
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    const handleSend = async (type: 'all' | 'individual', subscriberId?: string) => {
        if (!confirm(type === 'all' ? '전체 구독자에게 뉴스레터를 발송하시겠습니까?' : '이 구독자에게 뉴스레터를 발송하시겠습니까?')) return;

        setSending(true);
        try {
            const res = await fetch('/api/admin/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, subscriberId }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`성공적으로 발송되었습니다! (${data.count}명${data.simulated ? ' - 시뮬레이션 모드' : ''})`);
                fetchStatusData();
            } else {
                alert('발송 실패: ' + data.message);
            }
        } catch (e) {
            alert('이메일 발송 중 오류가 발생했습니다.');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (subscriberId: string) => {
        if (!confirm('정말로 이 구독자를 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/admin/subscribers/${subscriberId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                alert('삭제되었습니다.');
                fetchSubscribers();
            } else {
                alert('삭제 실패: ' + data.message);
            }
        } catch (e) {
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleLogout = async () => {
        document.cookie = 'admin_session=; Max-Age=0; path=/;';
        router.push('/admin');
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        // Handle both ISO strings with Z and without Z (KST from backend)
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const getKSTDatePart = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Add 9 hours for KST offset if the date is UTC (ends with Z or has no offset info)
        // If it's already a KST string without Z, new Date() might handle it differently.
        // Let's be explicit.
        const kstDate = new Date(date.getTime() + (date.getTimezoneOffset() === 0 ? 9 * 60 * 60 * 1000 : 0));
        return kstDate.toISOString().split('T')[0];
    };

    const calculateAverageOpenRate = () => {
        const validLogs = history.filter(log =>
            log.status === 'success' &&
            log.recipient_count > 0 &&
            !log.simulated
        );

        if (validLogs.length === 0) return '0.0';

        const totalOpenRate = validLogs.reduce((sum, log) => {
            const openRate = ((log.open_count || 0) / log.recipient_count) * 100;
            return sum + openRate;
        }, 0);

        return (totalOpenRate / validLogs.length).toFixed(1);
    };

    const calculateAverageClickRate = () => {
        const validLogs = history.filter(log =>
            log.status === 'success' &&
            log.recipient_count > 0 &&
            !log.simulated
        );

        if (validLogs.length === 0) return '0.0';

        const totalClickRate = validLogs.reduce((sum, log) => {
            const clickRate = ((log.click_count || 0) / log.recipient_count) * 100;
            return sum + clickRate;
        }, 0);

        return (totalClickRate / validLogs.length).toFixed(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">데이터를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans text-white selection:bg-blue-500/30">
            {/* Ambient background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" style={{ fontFamily: 'Pretendard, sans-serif' }}>오뉴 관리자</span>
                        <nav className="hidden md:flex space-x-1">
                            {[
                                { id: 'stats', label: '발송 통계', icon: BarChart3 },
                                { id: 'subscribers', label: '구독자 목록', icon: Users },
                                { id: 'history', label: '발송 이력', icon: History }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-2.5 rounded-xl hover:bg-white/5 group" title="로그아웃">
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
                {/* Top Row: Quick Stats & Primary Action */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">전체 구독자</h3>
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                    <Users className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-5xl font-black text-white">{stats.total.toLocaleString()}</p>
                                <span className="text-slate-500 font-bold">명</span>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">활성 구독자</h3>
                                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-5xl font-black text-white">{stats.active.toLocaleString()}</p>
                                <span className="text-slate-500 font-bold">명</span>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">평균 오픈율</h3>
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                    <Mail className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-5xl font-black text-white">{calculateAverageOpenRate()}</p>
                                <span className="text-slate-500 font-bold">%</span>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">평균 클릭율</h3>
                                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                                    <Mail className="w-6 h-6 text-purple-400" />
                                </div>
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-5xl font-black text-white">{calculateAverageClickRate()}</p>
                                <span className="text-slate-500 font-bold">%</span>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-4">
                        <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-xl p-8 rounded-[2rem] border border-blue-500/20 shadow-2xl h-full flex flex-col justify-center">
                            <h3 className="text-white text-lg font-black mb-6 flex items-center gap-2">
                                <SendHorizontal className="w-5 h-5 text-blue-400" />
                                빠른 발송
                            </h3>
                            <button
                                onClick={() => handleSend('all')}
                                disabled={sending}
                                className="w-full bg-white text-slate-950 hover:bg-blue-50 px-6 py-5 rounded-2xl font-black transition-all duration-300 flex items-center justify-center shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50"
                            >
                                {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mail className="w-6 h-6 mr-3" />}
                                전체 뉴스레터 발송 ({stats.active}명)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'subscribers' && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <Users className="w-5 h-5 text-blue-400" />
                                구독자 관리
                            </h2>
                            <button onClick={fetchSubscribers} className="text-slate-500 hover:text-white transition-all p-2.5 rounded-xl hover:bg-white/10 active:rotate-180 duration-500">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-950/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-8 py-5">이메일 (마스킹)</th>
                                        <th className="px-8 py-5">가입일</th>
                                        <th className="px-8 py-5">상태</th>
                                        <th className="px-8 py-5 text-right">작업</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {subscribers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-bold italic">
                                                아직 구독자가 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        subscribers.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-5 text-sm font-bold text-slate-200 font-mono">
                                                    {sub.email}
                                                </td>
                                                <td className="px-8 py-5 text-xs font-medium text-slate-500">
                                                    {formatDate(sub.created_at)}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${sub.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                                        {sub.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right space-x-3">
                                                    <button
                                                        onClick={() => handleSend('individual', sub.id)}
                                                        disabled={sending}
                                                        className="text-blue-400 hover:text-white text-xs font-black transition-all border border-blue-500/30 bg-blue-500/5 px-4 py-2 rounded-xl hover:bg-blue-500 active:scale-95"
                                                    >
                                                        메일 발송
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sub.id)}
                                                        className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                        title="구독 삭제"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="space-y-10">
                        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                            <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                최근 7일 발송 트렌드
                            </h2>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px', color: '#fff' }}
                                            itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorCount)"
                                            name="발송량"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Combined Metrics Integrated Table */}
                        <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 text-blue-400" />
                                    통합 일별 성과 분석
                                </h2>
                                <div className="flex gap-4">
                                    <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <Mail className="w-3 h-3 text-blue-400" /> 뉴스레터
                                    </span>
                                    <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <Layout className="w-3 h-3 text-purple-400" /> 웹 사이트
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-950/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                                            <th className="px-8 py-5 border-r border-white/5">날짜</th>
                                            <th className="px-8 py-5 bg-blue-500/5" colSpan={3}>📧 뉴스레터 발송 및 추적</th>
                                            <th className="px-8 py-5 bg-purple-500/5" colSpan={2}>🌐 웹 사이트(홈) 통계</th>
                                        </tr>
                                        <tr className="bg-slate-950/30 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-white/5">
                                            <th className="px-8 py-3 border-r border-white/5"></th>
                                            <th className="px-6 py-3 bg-blue-500/5">발송량</th>
                                            <th className="px-6 py-3 bg-blue-500/5">오픈(율)</th>
                                            <th className="px-6 py-3 bg-blue-500/5">클릭(율)</th>
                                            <th className="px-6 py-3 bg-purple-500/5">페이지 뷰(PV)</th>
                                            <th className="px-6 py-3 bg-purple-500/5">클릭 횟수</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {(() => {
                                            const kstOffset = 9 * 60 * 60 * 1000;

                                            // Process all dates from both history and webStats
                                            const allDates = new Set([
                                                ...history.filter(log => log.status === 'success' && !log.simulated).map(log => {
                                                    if (!log.sent_at) return '';
                                                    const d = new Date(log.sent_at);
                                                    // If it doesn't have Z, it might be local KST already or UTC. 
                                                    // Check if it's likely KST (no Z) or UTC (Z)
                                                    const isNativeUTC = log.sent_at.endsWith('Z');
                                                    const kstDate = isNativeUTC ? new Date(d.getTime() + kstOffset) : d;
                                                    return kstDate.toISOString().split('T')[0];
                                                }).filter(Boolean),
                                                ...Object.keys(webStats)
                                            ]);

                                            const sortedDates = Array.from(allDates).sort((a, b) =>
                                                new Date(b).getTime() - new Date(a).getTime()
                                            );

                                            return sortedDates.length === 0 ? (
                                                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-bold italic">통계 데이터가 없습니다.</td></tr>
                                            ) : (
                                                sortedDates.map((date) => {
                                                    // Aggregate mail stats for this date (KST)
                                                    const dayLogs = history.filter(log => {
                                                        if (!log.sent_at || log.status !== 'success' || log.simulated) return false;
                                                        const d = new Date(log.sent_at);
                                                        const isNativeUTC = log.sent_at.endsWith('Z');
                                                        const kstDate = isNativeUTC ? new Date(d.getTime() + kstOffset) : d;
                                                        return kstDate.toISOString().split('T')[0] === date;
                                                    });

                                                    const totalRecipients = dayLogs.reduce((sum, log) => sum + (log.recipient_count || 0), 0);
                                                    const totalOpens = dayLogs.reduce((sum, log) => sum + (log.open_count || 0), 0);
                                                    const totalClicks = dayLogs.reduce((sum, log) => sum + (log.click_count || 0), 0);

                                                    const openRate = totalRecipients > 0 ? ((totalOpens / totalRecipients) * 100).toFixed(1) : '0.0';
                                                    const clickRate = totalRecipients > 0 ? ((totalClicks / totalRecipients) * 100).toFixed(1) : '0.0';

                                                    // Web stats
                                                    const ws = webStats[date] || { pv: 0, clicks: 0 };

                                                    return (
                                                        <tr key={date} className="hover:bg-white/[0.02] transition-colors group">
                                                            <td className="px-8 py-5 font-bold text-slate-300 border-r border-white/5">{date}</td>

                                                            {/* NewsLetter Columns */}
                                                            <td className="px-6 py-5 bg-blue-500/[0.02] group-hover:bg-blue-500/[0.05]">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black text-white">{totalRecipients.toLocaleString()}</span>
                                                                    <span className="text-[10px] text-slate-500 uppercase font-black">건</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 bg-blue-500/[0.02] group-hover:bg-blue-500/[0.05]">
                                                                <div className="space-y-1">
                                                                    <div className="font-bold text-blue-400">{totalOpens.toLocaleString()}회</div>
                                                                    <div className="text-[10px] font-black text-blue-500/50">{openRate}%</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 bg-blue-500/[0.02] group-hover:bg-blue-500/[0.05]">
                                                                <div className="space-y-1">
                                                                    <div className="font-bold text-green-400">{totalClicks.toLocaleString()}회</div>
                                                                    <div className="text-[10px] font-black text-green-500/50">{clickRate}%</div>
                                                                </div>
                                                            </td>

                                                            {/* Web Stats Columns */}
                                                            <td className="px-6 py-5 bg-purple-500/[0.02] group-hover:bg-purple-500/[0.05]">
                                                                <div className="flex items-center gap-2">
                                                                    <Layout className="w-3 h-3 text-purple-400" />
                                                                    <span className="font-bold text-pink-400">{ws.pv.toLocaleString()}</span>
                                                                    <span className="text-[10px] text-slate-500 uppercase font-black">PV</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 bg-purple-500/[0.02] group-hover:bg-purple-500/[0.05]">
                                                                <div className="flex items-center gap-2">
                                                                    <MousePointer2 className="w-3 h-3 text-purple-400" />
                                                                    <span className="font-bold text-amber-400">{ws.clicks.toLocaleString()}</span>
                                                                    <span className="text-[10px] text-slate-500 uppercase font-black">클릭</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* System Status Table */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                                <h3 className="text-white text-lg font-black mb-6 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-blue-400" />
                                    발송 시스템 정보
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                                        <span className="text-slate-400 text-sm font-bold">연동 계정</span>
                                        <span className="text-white font-mono text-sm">{quota?.sender || 'birddogmary24@gmail.com'}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                                        <span className="text-slate-400 text-sm font-bold">일일 발송 제한</span>
                                        <span className="text-white font-bold">{quota?.limit || 500}건</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                                <h3 className="text-white text-lg font-black mb-6 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    오늘의 발송 현황
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">사용량</p>
                                            <p className="text-3xl font-black text-white">{quota?.todayCount || 0} <span className="text-slate-500 text-lg">/ {quota?.limit || 500}</span></p>
                                        </div>
                                        <span className="text-blue-400 font-black text-xl">
                                            {Math.round(((quota?.todayCount || 0) / (quota?.limit || 500)) * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                                            style={{ width: `${Math.min(100, ((quota?.todayCount || 0) / (quota?.limit || 500)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <History className="w-5 h-5 text-purple-400" />
                                최근 발송 히스토리
                            </h2>
                            <button onClick={fetchStatusData} className="text-slate-500 hover:text-white transition-all p-2.5 rounded-xl hover:bg-white/10">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-950/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-8 py-5">발송 시간</th>
                                        <th className="px-8 py-5">유형</th>
                                        <th className="px-8 py-5">발송 건수</th>
                                        <th className="px-8 py-5">오픈 수</th>
                                        <th className="px-8 py-5">클릭 수</th>
                                        <th className="px-8 py-5">오픈율</th>
                                        <th className="px-8 py-5 text-right">상태</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-20 text-center text-slate-500 font-bold italic">
                                                발송 이력이 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((log) => (
                                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-5 font-medium text-slate-300">
                                                    {formatDate(log.sent_at)}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${log.type === 'all' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : log.type === 'individual' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {log.type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 font-black text-white">
                                                    {log.recipient_count}건
                                                </td>
                                                <td className="px-8 py-5 font-bold text-blue-400">
                                                    {log.open_count || 0}
                                                </td>
                                                <td className="px-8 py-5 font-bold text-purple-400">
                                                    {log.click_count || 0}
                                                </td>
                                                <td className="px-8 py-5 font-bold text-green-400">
                                                    {log.recipient_count > 0
                                                        ? `${((log.open_count || 0) / log.recipient_count * 100).toFixed(1)}%`
                                                        : '-'}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${log.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                                        {log.simulated ? 'SIMULATED' : log.status.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
