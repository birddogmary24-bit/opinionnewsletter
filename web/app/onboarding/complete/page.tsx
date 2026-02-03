'use client';

import { useRouter } from 'next/navigation';
import { Check, Home } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function OnboardingCompletePage() {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Simple animation delay
        const timer = setTimeout(() => setShowContent(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-white px-4">
            <div className={`transition-all duration-1000 transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} flex flex-col items-center max-w-md text-center`}>

                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-6 shadow-2xl shadow-green-500/30">
                        <Check className="w-12 h-12 text-white" strokeWidth={4} />
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-black mb-4">설정이 완료되었습니다!</h1>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                    선택하신 관심사를 바탕으로<br />
                    매일 아침 가장 알맞은 인사이트를 배달해드릴게요.
                </p>

                <div className="space-y-4 w-full">
                    <Link
                        href="/"
                        className="w-full bg-white text-slate-950 py-4 px-8 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all shadow-xl hover:shadow-white/10 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
