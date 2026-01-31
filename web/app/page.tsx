'use client';

import { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle, Loader2, Play, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface Content {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    description?: string;
    scraped_at: string;
    opinion_leader: string;
}

export default function Home() {
    const [email, setEmail] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [contents, setContents] = useState<Content[]>([]);
    const [loadingContent, setLoadingContent] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    const categories = ['All', '슈카월드', '매경 월가월부'];

    useEffect(() => {
        async function fetchContents() {
            try {
                const res = await fetch('/api/contents');
                const data = await res.json();
                if (data.contents) {
                    setContents(data.contents);
                }
            } catch (e) {
                console.error("Failed to load contents", e);
            } finally {
                setLoadingContent(false);
            }
        }
        fetchContents();
    }, []);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            alert('올바른 이메일 주소를 입력해주세요.');
            return;
        }
        if (!agreed) {
            alert('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setStatus('success');
                setEmail('');
                setAgreed(false);
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    const topContents = contents.slice(0, 6);
    const remainingContents = contents.slice(6);

    const filteredRemaining = activeTab === 'All'
        ? remainingContents
        : remainingContents.filter(c => c.opinion_leader.includes(activeTab));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans">
            {/* Ambient background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" style={{ fontFamily: 'Pretendard, sans-serif' }}>
                            오뉴
                        </span>
                        <span className="text-slate-500 text-sm">-</span>
                        <span className="text-slate-400 text-sm font-medium">오피니언 뉴스레터</span>
                    </div>
                    <button
                        onClick={() => document.getElementById('subscribe-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2 rounded-lg transition-all shadow-lg shadow-blue-500/20"
                    >
                        구독하기
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-20 px-4">
                <div className="container mx-auto max-w-4xl text-center relative z-10">
                    <div className="inline-block mb-6 px-4 py-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-full">
                        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">매일 아침 7시 배달</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            신호를 찾는 사람들을 위한
                        </span>
                        <br />
                        <span className="text-white">오피니언 뉴스레터</span>
                    </h1>
                    <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        경제, 정치, 테크 분야 최고 전문가들의 통찰을 엄선하여<br className="hidden md:block" />
                        매일 아침 당신의 메일함으로 배달합니다.
                    </p>

                    {/* Subscribe Form */}
                    <div id="subscribe-form" className="max-w-md mx-auto">
                        <form onSubmit={handleSubscribe} className="space-y-4">
                            <div className="flex items-center bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-2 shadow-xl">
                                <Mail className="ml-3 text-slate-400 w-5 h-5 flex-shrink-0" />
                                <input
                                    type="email"
                                    placeholder="이메일 주소를 입력하세요"
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 px-4 py-3 outline-none"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-70 flex items-center shadow-lg shadow-blue-500/30"
                                >
                                    {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                        status === 'success' ? <Check className="w-5 h-5" /> :
                                            '구독'}
                                </button>
                            </div>

                            <label className="flex items-start space-x-2 text-left cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                />
                                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                                    개인정보 수집 및 이용에 동의합니다. (필수)
                                </span>
                            </label>

                            {status === 'success' && (
                                <div className="flex items-center justify-center space-x-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 py-3 rounded-lg animate-fade-in">
                                    <Check className="w-4 h-4" />
                                    <span>구독해주셔서 감사합니다!</span>
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="flex items-center justify-center space-x-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 py-3 rounded-lg">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>오류가 발생했습니다. 다시 시도해주세요.</span>
                                </div>
                            )}
                        </form>
                        <p className="text-slate-500 text-xs mt-4">
                            1,000+ 전문가들이 구독 중 • 무료 • 언제든 구독 해지 가능
                        </p>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 px-4 border-t border-slate-800/50">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <h3 className="text-white font-bold mb-2 text-lg">심층 시장 분석</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                슈카월드, 매경 등 검증된 경제 전문가들의 심층 분석을 요약합니다.
                            </p>
                        </div>
                        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-white font-bold mb-2 text-lg">글로벌 관점</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                월스트리트 저널, 블룸버그 등 해외 주요 이슈의 핵심을 짚어드립니다.
                            </p>
                        </div>
                        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all">
                            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-white font-bold mb-2 text-lg">리더를 위한 큐레이션</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                가벼운 가십은 제외하고, 의사결정에 필요한 정보만을 선별합니다.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Preview */}
            <main className="py-20 px-4 relative z-10">
                <div className="container mx-auto max-w-6xl">
                    {/* Section Header */}
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">최신 콘텐츠</h2>
                        <p className="text-slate-400">오늘 발행된 뉴스레터에 포함된 주요 아티클들입니다</p>
                    </div>

                    {loadingContent ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Top Contents Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                                {topContents.map((item) => (
                                    <article key={item.id} className="group bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/50 transition-all hover:shadow-xl hover:shadow-blue-500/10">
                                        {item.thumbnail && (
                                            <div className="relative aspect-video overflow-hidden bg-slate-900">
                                                <img
                                                    src={item.thumbnail}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
                                                    {item.opinion_leader}
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-6">
                                            <h3 className="font-bold text-lg text-white mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                                {item.title}
                                            </h3>
                                            {item.description && (
                                                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4">
                                                    {item.description}
                                                </p>
                                            )}
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-xs font-semibold text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors"
                                            >
                                                원문 보기 <ExternalLink className="ml-1 w-3 h-3" />
                                            </a>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {/* Category Tabs */}
                            {remainingContents.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveTab(cat)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === cat
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                                        : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Remaining Contents List */}
                            <div className="space-y-4">
                                {filteredRemaining.map((item) => (
                                    <article key={item.id} className="group bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all hover:shadow-lg hover:shadow-blue-500/5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/30">
                                                        {item.opinion_leader}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(item.scraped_at).toLocaleDateString('ko-KR')}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                                    {item.title}
                                                </h3>
                                                {item.description && (
                                                    <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs font-semibold text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors"
                                                >
                                                    원문 보기 <ExternalLink className="ml-1 w-3 h-3" />
                                                </a>
                                            </div>
                                            {item.thumbnail && (
                                                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-900">
                                                    <img
                                                        src={item.thumbnail}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900/50 backdrop-blur-xl border-t border-slate-800/50 text-slate-500 py-12 text-sm text-center relative z-10">
                <div className="container mx-auto px-4">
                    <p className="mb-4 text-slate-400">© 2026 오뉴. All rights reserved.</p>
                    <div className="flex justify-center gap-6">
                        <a href="#" className="hover:text-blue-400 transition-colors">이용약관</a>
                        <a href="#" className="hover:text-blue-400 transition-colors">개인정보처리방침</a>
                        <a href="#" className="hover:text-blue-400 transition-colors">문의하기</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
