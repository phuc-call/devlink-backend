import React, { useEffect } from 'react';
import AppRouter from './router';
import { ToastProvider } from './context/Toastcontext';

export default function App() {
    useEffect(() => {
        const handlePlay = (e: Event) => {
            const target = e.target as HTMLVideoElement;
            if (target && target.tagName === 'VIDEO') {
                const videos = document.querySelectorAll('video');
                videos.forEach(v => {
                    if (v !== target && !v.paused) {
                        v.pause();
                    }
                });
            }
        };
        document.addEventListener('play', handlePlay, true);
        return () => {
            document.removeEventListener('play', handlePlay, true);
        };
    }, []);

    return (
        <ToastProvider>
            <AppRouter />
        </ToastProvider>
    );
}
 