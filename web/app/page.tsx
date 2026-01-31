'use client';

import { useState, useEffect } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle, TrendingUp, BookOpen, Globe } from 'lucide-react';

interface Content {
    id: string;
    title: string;
    thumbnail: string;
    opinion_leader: string;
    description: string;
    url: string;
}

export default function Home() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [contents, setContents] = useState<Content[]>([]);
    const [loadingContent, setLoadingContent] = useState(true);

    // Fetch contents on load
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

    return (
        <main className="min-h-screen bg-navy-50 text-navy-900 font-sans selection:bg-navy-200">
            {/* Header */}
            <header className="border-b border-navy-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl font-serif font-bold tracking-tight text-navy-900">ONEW</span>
                        <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-navy-500 mt-1 ml-2">Opinion Newsletter</span>
                    </div>
                    <nav className="hidden md:flex space-x-6 text-sm font-medium text-navy-600">
                        <a href="#features" className="hover:text-navy-900 transition-colors">Features</a>
                        <a href="#preview" className="hover:text-navy-900 transition-colors">Preview</a>
                        <a href="#subscribe" className="text-gold-500 hover:text-gold-400 font-semibold transition-colors">Subscribe</a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-32 bg-navy-900 text-white text-center">
                {/* Abstract Background patterns */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500 rounded-full blur-[120px]" />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 z-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-navy-800 border border-navy-700 text-navy-200 text-xs font-semibold tracking-wider mb-6">
                        DAILY INSIGHTS FOR LEADERS
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-6 tracking-tight">
                        The Signal in the Noise.
                    </h1>
                    <p className="text-lg md:text-xl text-navy-200 mb-10 max-w-2xl mx-auto leading-relaxed">
                        매일 아침 7시. 경제, 정치, 테크 분야 최고 전문가들의 통찰을 <br className="hidden md:block" />
                        엄선하여 당신의 메일함으로 배달합니다.
                    </p>

                    <form onSubmit={handleSubscribe} className="max-w-md mx-auto relative mb-4">
                        <div className="flex items-center bg-white rounded-full p-2 shadow-2xl shadow-navy-900/50">
                            <Mail className="ml-3 text-navy-400 w-5 h-5 flex-shrink-0" />
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="flex-1 bg-transparent border-none focus:ring-0 text-navy-900 placeholder:text-navy-400 px-4 py-2 outline-none"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={status === 'loading' || status === 'success'}
                                className="bg-navy-800 hover:bg-navy-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 disabled:opacity-70 flex items-center"
                            >
                                {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                    status === 'success' ? <CheckCircle className="w-5 h-5" /> :
                                        'Subscribe'}
                            </button>
                        </div>
                    </form>
                    {status === 'success' && <p className="text-green-400 text-sm mt-3 animate-fade-in">구독해주셔서 감사합니다. 곧 찾아뵙겠습니다.</p>}
                    <p className="text-navy-400 text-xs mt-4">
                        Join 1,000+ professionals. Free forever. Unsubscribe anytime.
                    </p>
                </div>
            </section>

            {/* Trust & Features Bar */}
            <div className="border-b border-navy-200 bg-white">
                <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start p-4 hover:bg-navy-50 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 mb-4">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="text-navy-900 font-bold mb-2">Deep Markets Analysis</h3>
                        <p className="text-navy-500 text-sm leading-relaxed">슈카월드, 매경 등 검증된 경제 전문가들의 심층 분석을 요약합니다.</p>
                    </div>
                    <div className="flex flex-col items-center md:items-start p-4 hover:bg-navy-50 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 mb-4">
                            <Globe className="w-5 h-5" />
                        </div>
                        <h3 className="text-navy-900 font-bold mb-2">Global Perspective</h3>
                        <p className="text-navy-500 text-sm leading-relaxed">월스트리트 저널, 블룸버그 등 해외 주요 이슈의 핵심을 짚어드립니다.</p>
                    </div>
                    <div className="flex flex-col items-center md:items-start p-4 hover:bg-navy-50 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 mb-4">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h3 className="text-navy-900 font-bold mb-2">Curated for Leaders</h3>
                        <p className="text-navy-500 text-sm leading-relaxed">가벼운 가십은 제외하고, 의사결정에 필요한 정보만을 선별합니다.</p>
                    </div>
                </div>
            </div>

            {/* Review Section (Live Data) */}
            <section id="preview" className="py-24 bg-navy-50">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl font-serif font-bold text-navy-900 mb-4">Today's Edition Preview</h2>
                            <p className="text-navy-500 max-w-xl">
                                오늘 아침 발행된 뉴스레터에 포함된 주요 아티클들입니다.
                            </p>
                        </div>
                        <a href="#" className="hidden md:flex items-center text-navy-700 font-semibold hover:text-navy-900">
                            View All Archive <ArrowRight className="ml-2 w-4 h-4" />
                        </a>
                    </div>

                    {loadingContent ? (
                        <div className="h-96 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-navy-300 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {contents.map((item) => (
                                <article key={item.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-navy-100 flex flex-col h-full">
                                    <div className="relative aspect-video overflow-hidden bg-navy-100">
                                        <img
                                            src={item.thumbnail}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-navy-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                                            {item.opinion_leader}
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="font-bold text-lg text-navy-900 mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-navy-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                                            {item.description}
                                        </p>
                                        <div className="pt-4 mt-auto border-t border-navy-50">
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-navy-400 hover:text-navy-700 uppercase tracking-wider flex items-center">
                                                Read Original <ArrowRight className="ml-1 w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    <div className="mt-12 text-center md:hidden">
                        <a href="#" className="inline-flex items-center text-navy-700 font-semibold hover:text-navy-900">
                            View All Archive <ArrowRight className="ml-2 w-4 h-4" />
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-navy-200 py-12">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                    <div className="mb-4 md:mb-0">
                        <span className="text-xl font-serif font-bold text-navy-900">ONEW</span>
                        <p className="text-navy-400 text-sm mt-2">© 2026 Opinion Newsletter. All rights reserved.</p>
                    </div>
                    <div className="flex space-x-6 text-sm text-navy-500">
                        <a href="#" className="hover:text-navy-900">Privacy Policy</a>
                        <a href="#" className="hover:text-navy-900">Terms of Service</a>
                        <a href="#" className="hover:text-navy-900">Contact Support</a>
                    </div>
                </div>
            </footer>
        </main>
    );
}
