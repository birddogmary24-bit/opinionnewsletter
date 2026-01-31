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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans selection:bg-blue-500/30">
            {/* Ambient background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-size-200 animate-gradient text-transparent bg-clip-text tracking-tighter" style={{ fontFamily: 'Pretendard, sans-serif' }}>
                                오뉴
                            </span>
                            <span className="w-px h-4 bg-slate-700"></span>
                            <span className="text-base font-bold text-slate-100 uppercase tracking-tight">오피니언 뉴스레터</span>
                        </div>
                    </div>
                    <button
                        onClick={() => document.getElementById('subscribe-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hidden sm:block text-sm font-bold bg-white text-slate-950 px-6 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/10"
                    >
                        구독하기
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-10 pb-12 px-4 overflow-hidden">
                <div className="container mx-auto max-w-5xl text-center relative z-10">
                    <div className="inline-block mb-6 px-5 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-blue-500/30 rounded-full shadow-2xl shadow-blue-500/10 animate-bounce-subtle">
                        <span className="text-xs md:text-sm font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            매일 아침 7시 통찰의 배달
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight tracking-tight italic">
                        <span className="text-white">진짜를 보는 </span>{" "}
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-1">
                            단 하나의 관점
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
                        세상의 소음속에서 본질을 꿰뚫는 전문가<br />
                        오피니언 리더의 시선을 매일 아침 전달드립니다.
                    </p>

                    {/* Subscribe Form */}
                    <div id="subscribe-form" className="max-w-xl mx-auto px-4">
                        <form onSubmit={handleSubscribe} className="space-y-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-slate-900 border-2 border-white/20 rounded-2xl p-1.5 shadow-2xl transition-all group-focus-within:border-white">
                                    <div className="flex items-center flex-1">
                                        <Mail className="ml-4 text-white w-5 h-5 flex-shrink-0" />
                                        <input
                                            type="email"
                                            placeholder="이메일 주소"
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/50 px-4 py-3 text-base md:text-lg outline-none"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading' || status === 'success'}
                                        className="bg-white text-slate-950 px-8 py-3 md:py-4 rounded-xl font-black text-base md:text-lg transition-all duration-200 disabled:opacity-70 flex items-center justify-center hover:bg-blue-50 active:scale-95 shadow-xl mt-2 md:mt-0"
                                    >
                                        {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                            status === 'success' ? <Check className="w-5 h-5" /> :
                                                '무료 구독'}
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-center justify-center space-x-3 text-left cursor-pointer group py-2">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="peer appearance-none w-5 h-5 rounded-md border-2 border-white/20 bg-slate-800 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                                    />
                                    <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                </div>
                                <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
                                    개인정보 수집 및 이용에 동의합니다. (필수)
                                </span>
                            </label>

                            {status === 'success' && (
                                <div className="flex items-center justify-center space-x-3 text-green-400 font-bold text-base bg-green-500/10 border-2 border-green-500/30 p-4 rounded-2xl animate-fade-in shadow-2xl shadow-green-500/10">
                                    <Check className="w-5 h-5" />
                                    <span>구독되었습니다! 내일부터 배달됩니다.</span>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </section>

            {/* Features Stats Bar */}
            <div className="bg-white/5 border-y border-white/5 backdrop-blur-md">
                <div className="container mx-auto max-w-6xl px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="flex flex-col md:flex-row items-center justify-center md:space-x-3">
                            <div className="text-lg font-bold text-white tracking-tighter">1,200+</div>
                            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">누적 구독자</div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center justify-center md:space-x-3">
                            <div className="text-lg font-bold text-white tracking-tighter">07:00 AM</div>
                            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">매일 배송 시간</div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center justify-center md:space-x-3">
                            <div className="text-lg font-bold text-white tracking-tighter">Top 30</div>
                            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">엄선된 전문 리포트</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Preview */}
            <main className="py-20 px-4 relative z-10 bg-slate-950/50">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-l-4 border-blue-500 pl-8 text-left">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter leading-tight">
                                오늘의 뉴스레터<br className="md:hidden" /> 미리보기
                            </h2>
                            <p className="text-lg text-slate-400 font-medium italic">핵심만 선별한 오늘의 리포트입니다.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-base font-black text-white uppercase tracking-tighter">Live Updates</span>
                        </div>
                    </div>

                    {loadingContent ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <span className="font-bold text-slate-500 tracking-widest text-sm">지식을 불러오는 중...</span>
                        </div>
                    ) : (
                        <>
                            {/* Top Contents Grid - Visual Focus */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                                {topContents.map((item) => (
                                    <article key={item.id} className="group bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10">
                                        {item.thumbnail && (
                                            <div className="relative aspect-video overflow-hidden bg-slate-800">
                                                <img
                                                    src={item.thumbnail}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/10 shadow-2xl">
                                                    {item.opinion_leader}
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-8 text-left">
                                            <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                                                {item.title}
                                            </h3>
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group/btn inline-flex items-center text-xs font-black text-blue-400 hover:text-white uppercase tracking-widest transition-all"
                                            >
                                                원문 리포트 읽기
                                                <div className="ml-2 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center group-hover/btn:bg-blue-500 group-hover/btn:text-white transition-all">
                                                    <ExternalLink className="w-3 h-3" />
                                                </div>
                                            </a>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {/* Detailed List Section */}
                            <div className="max-w-5xl mx-auto">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                                    <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveTab(cat)}
                                                className={`px-8 py-3 rounded-2xl text-base font-bold transition-all whitespace-nowrap shadow-xl ${activeTab === cat
                                                    ? 'bg-white text-slate-950 shadow-white/20 scale-105'
                                                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-xs font-bold text-slate-500 italic">
                                        총 {filteredRemaining.length}건의 인사이트
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {filteredRemaining.map((item) => (
                                        <article key={item.id} className="group bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 md:p-8 hover:border-white/10 transition-all duration-300 hover:bg-slate-900/80 text-left">
                                            <div className="flex flex-col md:flex-row items-stretch md:items-start gap-6 md:gap-10">
                                                {item.thumbnail && (
                                                    <div className="w-full md:w-[280px] aspect-video flex-shrink-0 rounded-2xl overflow-hidden bg-slate-800 shadow-2xl relative">
                                                        <img
                                                            src={item.thumbnail}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-center flex-wrap gap-4 mb-4">
                                                        <span className="text-[10px] md:text-xs font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                                            {item.opinion_leader}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                            {new Date(item.scraped_at).toLocaleDateString('ko-KR')}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl md:text-2xl font-bold text-white mb-5 group-hover:text-blue-400 transition-colors leading-tight tracking-tight">
                                                        {item.title}
                                                    </h3>
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group/link inline-flex items-center text-xs font-black text-blue-400 hover:text-white uppercase tracking-widest transition-all"
                                                    >
                                                        상세 리포트 보기
                                                        <div className="ml-3 p-1 rounded-full border border-blue-500/30 group-hover/link:border-white transition-colors">
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </div>
                                                    </a>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-white/5 text-slate-500 py-24 text-base relative z-10 overflow-hidden">
                <div className="container mx-auto px-4 text-center">
                    <div className="mb-10 flex justify-center">
                        <span className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">오뉴</span>
                    </div>
                    <p className="mb-10 text-lg font-bold text-slate-400 tracking-tight italic">전달하는 것은 정보가 아니라, 세상을 보는 새로운 시선입니다.</p>
                    <div className="flex flex-wrap justify-center gap-10 mb-10">
                        <a href="#" className="font-bold hover:text-white transition-colors">이용약관</a>
                        <a href="#" className="font-bold hover:text-white transition-colors">개인정보처리방침</a>
                        <a href="#" className="font-bold hover:text-white transition-colors">문의하기</a>
                    </div>
                    <p className="text-sm border-t border-white/5 pt-10">© 2026 오뉴 - 오피니언 뉴스레터. All rights reserved.</p>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 8s ease infinite;
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
