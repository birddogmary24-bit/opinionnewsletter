'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, ArrowRight, X } from 'lucide-react';

interface Content {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    opinion_leader: string;
    category?: string;
}

function OnboardingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const subscriberId = searchParams.get('subscriberId');

    const [contents, setContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!subscriberId) {
            // If no ID, maybe redirect home or just show warning?
        }

        async function fetchContents() {
            try {
                const res = await fetch('/api/onboarding/contents');
                const data = await res.json();
                if (data.contents) {
                    setContents(data.contents);
                }
            } catch (e) {
                console.error("Failed to load contents", e);
            } finally {
                setLoading(false);
            }
        }
        fetchContents();
    }, [subscriberId]);

    const toggleChannel = (channel: string) => {
        const newSelected = new Set(selectedChannels);
        if (newSelected.has(channel)) {
            newSelected.delete(channel);
        } else {
            newSelected.add(channel);
        }
        setSelectedChannels(newSelected);
    };

    const handleSkip = () => {
        if (confirm('건너뛰시겠습니까? 선택한 내용은 저장되지 않습니다.')) {
            router.push('/');
        }
    };

    const handleSubmit = async () => {
        if (selectedChannels.size === 0) {
            if (confirm('선택된 채널이 없습니다. 건너뛰시겠습니까?')) {
                router.push('/');
                return;
            }
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/onboarding/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriberId,
                    selectedChannels: Array.from(selectedChannels),
                    categories: [] // Future proofing
                }),
            });

            if (res.ok) {
                router.push('/onboarding/complete');
            } else {
                alert('저장에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (e) {
            alert('오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">오뉴</span>
                    <span className="text-sm text-slate-400 border-l border-slate-700 pl-3">맞춤 설정</span>
                </div>
                <button onClick={handleSkip} className="text-slate-400 hover:text-white text-sm font-bold transition-colors">
                    건너뛰기
                </button>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="text-center mb-12">
                    <h1 className="text-2xl md:text-4xl font-black mb-4">어떤 콘텐츠에 관심이 있으세요?</h1>
                    <p className="text-slate-400 text-sm md:text-base">선택하신 채널의 인사이트를 뉴스레터 최상단에 우선 배치해드립니다.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {contents.map((item) => {
                        const isSelected = selectedChannels.has(item.opinion_leader);
                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleChannel(item.opinion_leader)}
                                className={`
                                    relative cursor-pointer group rounded-2xl overflow-hidden border-2 transition-all duration-200
                                    ${isSelected ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-[0.98]' : 'border-white/5 hover:border-white/20 hover:-translate-y-1'}
                                `}
                            >
                                <div className="aspect-video bg-slate-800 relative">
                                    {item.thumbnail ? (
                                        <img src={item.thumbnail} alt={item.title} className={`w-full h-full object-cover transition-all duration-300 ${isSelected ? 'opacity-40' : 'group-hover:opacity-80'}`} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">No Image</div>
                                    )}

                                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                                        <div className="bg-blue-500 rounded-full p-2 shadow-xl transform scale-125">
                                            <Check className="w-6 h-6 text-white" />
                                        </div>
                                    </div>

                                    {/* Selection Circle Indicator (Unchecked state) */}
                                    {!isSelected && (
                                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-white/30 bg-black/20 backdrop-blur-sm group-hover:border-white/80 transition-colors"></div>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-900/50 backdrop-blur-sm">
                                    <div className="text-xs font-bold text-blue-400 mb-1">{item.opinion_leader}</div>
                                    <div className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug">{item.title}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Bottom Sticky Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 p-4 md:p-6 z-50">
                <div className="container mx-auto max-w-6xl flex items-center justify-between">
                    <div>
                        <span className="text-blue-400 font-bold text-xl">{selectedChannels.size}</span>
                        <span className="text-slate-400 font-bold ml-1">개 선택됨</span>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-white text-slate-950 px-8 py-3 rounded-xl font-black text-base md:text-lg hover:bg-blue-50 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        {submitting ? '저장 중...' : '확인'}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <OnboardingContent />
        </Suspense>
    );
}
