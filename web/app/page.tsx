'use client';

import { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle, Loader2, Play } from 'lucide-react';
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
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="font-serif text-2xl font-bold text-amber-400 tracking-tight">
                        오뉴
                    </div>
                    <button
                        onClick={() => document.getElementById('subscribe-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-sm font-medium bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded transition-colors"
                    >
                        구독하기
                    </button>
                </div>
            </header>

            {/* Hero & Subscription */}
            <section className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 py-8 md:py-10">
                <div className="container mx-auto px-4 text-center max-w-2xl">
                    <h1 className="font-serif text-2xl md:text-3xl font-bold text-amber-400 mb-2">
                        세상의 소음을 걸러낸 오피니언 뉴스레터
                    </h1>
                    <p className="text-slate-400 mb-6 text-sm md:text-base">
                        경제, 기술, 정치 분야의 최고 전문가들이 전하는 깊이 있는 통찰을 매일 아침 받아보세요.
                    </p>

                    <div id="subscribe-form" className="max-w-md mx-auto">
                        {status === 'success' ? (
                            <div className="text-emerald-400 flex flex-col items-center py-4 bg-slate-800/50 rounded-lg">
                                <Check className="w-8 h-8 mb-2" />
                                <p className="font-bold">구독 완료!</p>
                                <p className="text-sm text-slate-400">내일 아침에 만나요.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="space-y-3">
                                <div className="flex flex-col md:flex-row gap-2">
                                    <div className="relative flex-grow">
                                        <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="이메일 주소"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-100 placeholder-slate-500"
                                            disabled={status === 'loading'}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 py-3 rounded font-bold transition-all flex items-center justify-center whitespace-nowrap"
                                    >
                                        {status === 'loading' ? <Loader2 className="animate-spin w-5 h-5" /> : '구독'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="privacy-check"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500 rounded"
                                    />
                                    <label htmlFor="privacy-check" className="text-xs text-slate-400 cursor-pointer select-none">
                                        개인정보 수집/활용에 동의합니다.
                                    </label>
                                </div>
                                {status === 'error' && (
                                    <p className="text-red-400 text-sm flex items-center justify-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> 오류 발생. 다시 시도해주세요.
                                    </p>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12">
                {loadingContent ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                    </div>
                ) : (
                    <>
                        {/* Top Focus */}
                        <div className="mb-16">
                            <div className="flex items-center justify-between mb-6 border-b border-amber-500/30 pb-4">
                                <h2 className="text-xl font-bold font-serif text-amber-400">Today's Focus</h2>
                                <span className="text-xs text-slate-500 font-mono">{new Date().toLocaleDateString('ko-KR')}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                                {topContents.map((content) => (
                                    <a
                                        key={content.id}
                                        href={content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group block"
                                    >
                                        <div className="relative aspect-video bg-slate-800 overflow-hidden mb-3 rounded">
                                            {content.thumbnail ? (
                                                <Image
                                                    src={content.thumbnail}
                                                    alt={content.title}
                                                    fill
                                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <Play className="text-amber-400 opacity-0 group-hover:opacity-100 w-12 h-12 drop-shadow-lg transition-opacity" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                                                {content.opinion_leader}
                                            </span>
                                            <h3 className="text-lg font-bold leading-snug text-slate-200 group-hover:text-amber-400 transition-colors line-clamp-2">
                                                {content.title}
                                            </h3>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* More Insights */}
                        <div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-800 pb-2">
                                <h2 className="text-lg font-bold text-slate-200 mb-4 md:mb-0">More Insights</h2>

                                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveTab(cat)}
                                            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${activeTab === cat
                                                    ? 'bg-amber-500 text-slate-900 font-medium'
                                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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
                                        className="flex gap-4 group hover:bg-slate-900/50 p-2 rounded transition-colors"
                                    >
                                        <div className="relative w-32 h-20 flex-shrink-0 bg-slate-800 overflow-hidden rounded-sm">
                                            {content.thumbnail && (
                                                <Image
                                                    src={content.thumbnail}
                                                    alt={content.title}
                                                    fill
                                                    className="object-cover w-full h-full"
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-xs text-slate-500 mb-1">{content.opinion_leader}</span>
                                            <h4 className="text-sm font-medium leading-snug text-slate-300 group-hover:text-amber-400 line-clamp-2">
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

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-12 text-sm text-center">
                <div className="container mx-auto px-4">
                    <p className="mb-4">&copy; 2026 오뉴. All rights reserved.</p>
                    <div className="flex justify-center gap-6">
                        <a href="#" className="hover:text-amber-400 transition-colors">이용약관</a>
                        <a href="#" className="hover:text-amber-400 transition-colors">개인정보처리방침</a>
                        <a href="#" className="hover:text-amber-400 transition-colors">문의하기</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
