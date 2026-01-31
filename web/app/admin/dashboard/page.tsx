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
            <div className="min-h-screen bg-navy-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-navy-900 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy-50 font-sans text-navy-900">
            {/* Header */}
            <header className="bg-white border-b border-navy-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-xl font-serif font-bold text-navy-900 mr-8">ONEW Admin</span>
                        <nav className="hidden md:flex space-x-4">
                            <span className="text-navy-900 font-medium px-3 py-2 rounded-md bg-navy-50">Dashboard</span>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleLogout} className="text-navy-500 hover:text-red-600 transition-colors p-2">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-navy-500 text-sm font-medium uppercase tracking-wider">Total Subscribers</h3>
                            <Users className="w-5 h-5 text-navy-400" />
                        </div>
                        <p className="text-3xl font-bold text-navy-900">{stats.total}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-navy-500 text-sm font-medium uppercase tracking-wider">Active Status</h3>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-navy-900">{stats.active} Active</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-100 flex flex-col justify-center items-start">
                        <button
                            onClick={() => handleSend('all')}
                            disabled={sending}
                            className="w-full bg-navy-900 hover:bg-navy-800 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center shadow-lg shadow-navy-900/20 disabled:opacity-70"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                            Send to ALL ({stats.active})
                        </button>
                    </div>
                </div>

                {/* Subscribers Table */}
                <div className="bg-white rounded-xl shadow-sm border border-navy-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-navy-900">Subscriber Management</h2>
                        <button onClick={fetchSubscribers} className="text-navy-400 hover:text-navy-900 transition-colors p-2 rounded-full hover:bg-navy-50">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-navy-50 text-navy-600 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3 font-semibold">Email (Masked)</th>
                                    <th className="px-6 py-3 font-semibold">Joined Date</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-50">
                                {subscribers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-navy-400">
                                            No subscribers found yet.
                                        </td>
                                    </tr>
                                ) : (
                                    subscribers.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-navy-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-navy-900 font-mono">
                                                {sub.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-navy-500">
                                                {formatDate(sub.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleSend('individual', sub.id)}
                                                    disabled={sending}
                                                    className="text-navy-600 hover:text-navy-900 text-xs font-medium transition-colors border border-navy-200 px-3 py-1 rounded hover:bg-white"
                                                >
                                                    Send Email
                                                </button>
                                                <button className="text-navy-400 hover:text-red-600 text-xs font-medium transition-colors px-2">
                                                    Remove
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
