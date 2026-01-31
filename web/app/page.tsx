'use client';

import { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle, Loader2, ArrowRight, Play } from 'lucide-react';
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

    // Categories (Mapped from opinion_leader for now)
    // In a real app, this would come from the DB or config
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
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    // Logic: Top 6 are highlights. Rest are filtered list.
    const topContents = contents.slice(0, 6);
    const remainingContents = contents.slice(6);

    const filteredRemaining = activeTab === 'All'
        ? remainingContents
        : remainingContents.filter(c => c.opinion_leader.includes(activeTab));

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
            {/* 1. Simplified Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="font-serif text-2xl font-bold text-navy-900 tracking-tight">
                        ONEW
                    </div>
                    <button
                        onClick={() => document.getElementById('subscribe-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-sm font-medium bg-navy-900 text-white px-4 py-2 rounded hover:bg-navy-800 transition-colors"
                    >
                        구독하기
                    </button>
                </div>
            </header>

            {/* 2. Compact Hero & Subscription */}
            <section className="bg-white border-b border-slate-200 py-12 md:py-16">
                <div className="container mx-auto px-4 text-center max-w-2xl">
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        세상의 소음을 걸러낸<br />오피니언 뉴스레터
                    </h1>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        경제, 기술, 정치 분야의 최고 전문가들이 전하는<br className="hidden md:block" />
                        깊이 있는 통찰을 매일 아침 메일함으로 보내드립니다.
                    </p>

                    <div id="subscribe-form" className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm">
                        {status === 'success' ? (
                            <div className="text-green-600 flex flex-col items-center py-4">
                                <Check className="w-12 h-12 mb-2" />
                                <p className="font-bold">구독이 완료되었습니다.</p>
                                <p className="text-sm text-slate-500">내일 아침 뉴스레터에서 뵙겠습니다.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="relative flex-grow">
                                        <Mail className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="이메일 주소를 입력하세요"
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded focus:ring-2 focus:ring-navy-900 focus:border-navy-900 outline-none text-slate-900 placeholder-slate-400 bg-white"
                                            disabled={status === 'loading'}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="bg-navy-900 hover:bg-navy-800 text-white px-6 py-3 rounded font-bold transition-all flex items-center justify-center whitespace-nowrap"
                                    >
                                        {status === 'loading' ? <Loader2 className="animate-spin w-5 h-5" /> : '무료 구독하기'}
                                    </button>
                                </div>

                                {/* Privacy Consent */}
                                <div className="flex items-start justify-center gap-2 text-left">
                                    <input
                                        type="checkbox"
                                        id="privacy-check"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="mt-1"
                                    />
                                    <label htmlFor="privacy-check" className="text-xs text-slate-500 max-w-sm cursor-pointer select-none">
                                        개인정보(이메일) 수집 및 이용에 동의합니다. 수집된 정보는 뉴스레터 발송 외의 목적으로 사용되지 않으며, 언제든 구독을 취소할 수 있습니다.
                                    </label>
                                </div>
                                {status === 'error' && (
                                    <p className="text-red-500 text-sm flex items-center justify-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> 오류가 발생했습니다. 다시 시도해주세요.
                                    </p>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* 3. Main Content Area */}
            <main className="container mx-auto px-4 py-12">
                {loadingContent ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <>
                        {/* Top Focus Section */}
                        <div className="mb-16">
                            <div className="flex items-center justify-between mb-6 border-b border-black pb-4">
                                <h2 className="text-xl font-bold font-serif text-slate-900">Today's Focus</h2>
                                <span className="text-xs text-slate-500 font-mono">{new Date().toLocaleDateString('ko-KR')}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                                {topContents.map((content, idx) => (
                                    <a
                                        key={content.id}
                                        href={content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group block"
                                    >
                                        <div className="relative aspect-video bg-slate-200 overflow-hidden mb-3">
                                            {content.thumbnail ? (
                                                <Image
                                                    src={content.thumbnail}
                                                    alt={content.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <Play className="text-white opacity-0 group-hover:opacity-100 w-12 h-12 drop-shadow-lg transition-opacity" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-navy-600 uppercase tracking-wider">
                                                {content.opinion_leader}
                                            </span>
                                            <h3 className="text-lg font-bold leading-snug group-hover:text-navy-900 transition-colors line-clamp-2">
                                                {content.title}
                                            </h3>
                                            {/* Descriptions Removed as per user request */}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* More News Section */}
                        <div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-200 pb-2">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 md:mb-0">More Insights</h2>

                                {/* Filters */}
                                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveTab(cat)}
                                            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${activeTab === cat
                                                    ? 'bg-slate-900 text-white font-medium'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {filteredRemaining.map((content) => (
                                    <a
                                        key={content.id}
                                        href={content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex gap-4 group hover:bg-white p-2 rounded transition-colors"
                                    >
                                        <div className="relative w-32 h-20 flex-shrink-0 bg-slate-200 overflow-hidden rounded-sm">
                                            {content.thumbnail && (
                                                <Image
                                                    src={content.thumbnail}
                                                    alt={content.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-xs text-slate-500 mb-1">{content.opinion_leader}</span>
                                            <h4 className="text-sm font-medium leading-snug group-hover:text-navy-900 line-clamp-2">
                                                {content.title}
                                            </h4>
                                        </div>
                                    </a>
                                ))}
                                {filteredRemaining.length === 0 && (
                                    <div className="col-span-full text-center py-10 text-slate-500 text-sm">
                                        해당 카테고리의 콘텐츠가 아직 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Simple Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 text-sm text-center">
                <div className="container mx-auto px-4">
                    <p className="mb-4">&copy; 2026 ONEW. All rights reserved.</p>
                    <div className="flex justify-center gap-6">
                        <a href="#" className="hover:text-white">이용약관</a>
                        <a href="#" className="hover:text-white">개인정보처리방침</a>
                        <a href="#" className="hover:text-white">문의하기</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
