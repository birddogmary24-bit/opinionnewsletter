'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Mail, RefreshCw, LogOut, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Subscriber {
    id: string;
    email: string;
    created_at: string;
    status: string;
}

export default function AdminDashboard() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0 });
    const router = useRouter();

    useEffect(() => {
        fetchSubscribers();
    }, []);

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
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (type: 'all' | 'individual', subscriberId?: string) => {
        if (!confirm(type === 'all' ? 'Send newsletter to ALL subscribers?' : 'Send newsletter to this subscriber?')) return;

        setSending(true);
        try {
            const res = await fetch('/api/admin/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, subscriberId }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`Successfully sent! (${data.count} recipients${data.simulated ? ' - SIMULATED' : ''})`);
            } else {
                alert('Failed to send: ' + data.message);
            }
        } catch (e) {
            alert('Error sending email');
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
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans text-white">
            {/* Ambient background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mr-8" style={{ fontFamily: 'Pretendard, sans-serif' }}>오뉴 관리자</span>
                        <nav className="hidden md:flex space-x-4">
                            <span className="text-white font-medium px-3 py-2 rounded-lg bg-slate-700/50">대시보드</span>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">전체 구독자</h3>
                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white">{stats.total}</p>
                        <p className="text-xs text-slate-500 mt-2">총 가입자 수</p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">활성 상태</h3>
                            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white">{stats.active}</p>
                        <p className="text-xs text-slate-500 mt-2">활성 구독자</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-blue-500/30 hover:border-blue-400/50 transition-all flex flex-col justify-center">
                        <button
                            onClick={() => handleSend('all')}
                            disabled={sending}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center shadow-lg shadow-blue-500/30 disabled:opacity-70"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                            전체 발송 ({stats.active}명)
                        </button>
                    </div>
                </div>

                {/* Subscribers Table */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">구독자 관리</h2>
                        <button onClick={fetchSubscribers} className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700/50">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">이메일 (마스킹)</th>
                                    <th className="px-6 py-4 font-semibold">가입일</th>
                                    <th className="px-6 py-4 font-semibold">상태</th>
                                    <th className="px-6 py-4 font-semibold text-right">작업</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {subscribers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            아직 구독자가 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    subscribers.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-white font-mono">
                                                {sub.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {formatDate(sub.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                                                    {sub.status === 'active' ? '활성' : '비활성'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleSend('individual', sub.id)}
                                                    disabled={sending}
                                                    className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20"
                                                >
                                                    메일 발송
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sub.id)}
                                                    className="text-slate-400 hover:text-red-400 text-xs font-medium transition-colors px-2"
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
