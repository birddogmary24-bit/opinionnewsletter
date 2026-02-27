'use client';

import Script from "next/script";
import { usePathname } from "next/navigation";

export default function AmplitudeTracker() {
    const pathname = usePathname();

    // Do not run on admin pages to avoid conflicts
    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            {/* New Amplitude Script with Autocapture & Session Replay */}
            <Script
                src="https://cdn.amplitude.com/script/YOUR_AMPLITUDE_API_KEY.js"
                strategy="afterInteractive"
            />
            <Script id="amplitude-init" strategy="afterInteractive">
                {`
                    (function() {
                        function initAmplitude() {
                            if (window.amplitude && window.sessionReplay && window.amplitude.add) {
                                window.amplitude.add(window.sessionReplay.plugin({sampleRate: 1}));
                                window.amplitude.init('YOUR_AMPLITUDE_API_KEY', {
                                    "fetchRemoteConfig": true,
                                    "autocapture": {
                                        "attribution": true,
                                        "fileDownloads": true,
                                        "formInteractions": true,
                                        "pageViews": true,
                                        "sessions": true,
                                        "elementInteractions": true,
                                        "networkTracking": true,
                                        "webVitals": true,
                                        "frustrationInteractions": {
                                            "errorClicks": true,
                                            "deadClicks": true,
                                            "rageClicks": true
                                        }
                                    }
                                });
                                console.log("🔥 Amplitude Autocapture Initialized");
                            } else {
                                setTimeout(initAmplitude, 500);
                            }
                        }
                        initAmplitude();
                    })();
                `}
            </Script>
        </>
    );
}
