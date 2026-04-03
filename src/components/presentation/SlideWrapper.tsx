'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SlideData, PRESENTATION_DATA } from '@/lib/presentationData';
import {
    CoverSlide, ContentSlide, ComparisonSlide, FeaturesSlide,
    ImageSlide, CardsSlide, StatsSlide, TimelineSlide, ListSlide, TeamSlide
} from './SlideComponents';

export default function SlideWrapper({ slide, index }: { slide: SlideData; index: number }) {
    const router = useRouter();
    const total = PRESENTATION_DATA.length;

    const nextSlide = index < total - 1 ? PRESENTATION_DATA[index + 1] : null;
    const prevSlide = index > 0 ? PRESENTATION_DATA[index - 1] : null;

    const goTo = (s: SlideData | null) => {
        if (s) router.push(`/presentation/${s.slug}`);
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') goTo(nextSlide);
            if (e.key === 'ArrowLeft') goTo(prevSlide);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [nextSlide, prevSlide]);

    // Component Mapper
    const renderContent = () => {
        switch (slide.type) {
            case 'cover': return <CoverSlide slide={slide} />;
            case 'content': return <ContentSlide slide={slide} />;
            case 'comparison': return <ComparisonSlide slide={slide} />;
            case 'features': return <FeaturesSlide slide={slide} />;
            case 'image': return <ImageSlide slide={slide} />;
            case 'cards': return <CardsSlide slide={slide} />;
            case 'stats': return <StatsSlide slide={slide} />;
            case 'timeline': return <TimelineSlide slide={slide} />;
            case 'list': return <ListSlide slide={slide} />;
            case 'team': return <TeamSlide slide={slide} />;
            default: return <div style={{ padding: '5rem', color: '#0f172a', fontWeight: 'bold', fontSize: '2rem' }}>Error: Unknown Slide Type</div>;
        }
    };

    return (
        <div style={{
            height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', position: 'relative', background: '#f8fafc', fontFamily: 'sans-serif',
            userSelect: 'none'
        }}>

            {/* Background Decorative Pattern */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4,
                backgroundImage: `radial-gradient(circle at 1.5px 1.5px, #0ea5e9 1px, transparent 0)`,
                backgroundSize: '40px 40px'
            }} />
            <div style={{
                position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%',
                borderRadius: '50%', opacity: 0.1, filter: 'blur(100px)', background: '#0ea5e9'
            }} />

            {/* Header */}
            <header style={{
                padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', zIndex: 10, background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 900, fontSize: '1rem',
                        boxShadow: '0 4px 10px rgba(14, 165, 233, 0.2)'
                    }}>
                        Kw
                    </div>
                    <div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', display: 'block' }}>Team Kwids</span>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#0ea5e9', letterSpacing: '0.2em', textTransform: 'uppercase' }}>AR Electronics Lab</span>
                    </div>
                </div>
                <div style={{
                    padding: '0.35rem 1rem', borderRadius: '0.75rem', background: '#f1f5f9',
                    border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 'bold',
                    fontSize: '0.9rem', letterSpacing: '0.05em'
                }}>
                    <span style={{ color: '#0ea5e9' }}>{index + 1}</span> / {total}
                </div>
            </header>

            {/* Main Slide Area */}
            <main style={{
                flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '1.5rem', zIndex: 10, overflow: 'hidden'
            }}>
                {/* Content Card with Responsive Sizing - Strictly fit to screen */}
                <div style={{
                    width: '100%', maxWidth: 'min(92vw, 1100px)',
                    height: 'auto', aspectRatio: '16/9',
                    maxHeight: 'calc(100vh - 180px)', // Strict fitting
                    background: '#fff',
                    borderRadius: '24px',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    animation: 'cardEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)'
                }}>
                    {renderContent()}
                </div>
            </main>

            {/* Footer */}
            <footer style={{
                padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', zIndex: 10, background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)', borderTop: '1px solid #e2e8f0'
            }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {PRESENTATION_DATA.map((_, i) => (
                        <div key={i} style={{
                            height: '0.25rem', borderRadius: '9999px', transition: 'all 0.5s',
                            width: i === index ? '2.5rem' : '0.5rem',
                            background: i === index ? '#0ea5e9' : '#e2e8f0'
                        }} />
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <div style={{ width: '0.3rem', height: '0.3rem', borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', letterSpacing: '0.1rem', textTransform: 'uppercase' }}>CREATEX 2026 Submission</span>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes cardEnter {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* Hide Next.js dev indicator/badges */
                #__next-build-watcher, 
                #__next-indicator-wrapper,
                [data-nextjs-toast], 
                [data-nextjs-dialog] {
                    display: none !important;
                }
                /* Also hide the common circular indicator sometimes injected as a static button */
                button[aria-label="Next.js"] {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
