'use client';

import React from 'react';
import Image from 'next/image';
import {
    Zap, ShieldCheck, Globe, Users, Monitor,
    TrendingUp, Cpu, Award, ZapOff, CheckCircle,
    BarChart3, Layers, Layout, Lock, GraduationCap,
    Lightbulb, Target, Rocket, Users2
} from 'lucide-react';
import { SlideData } from '@/lib/presentationData';

const ICON_MAP: Record<string, any> = {
    Zap, ShieldCheck, Globe, Users, Monitor,
    TrendingUp, Cpu, Award, ZapOff, CheckCircle,
    BarChart3, Layers, Layout, Lock, GraduationCap,
    Lightbulb, Target, Rocket, Users2
};

const THEME = {
    primary: '#0ea5e9', // Sky Blue
    secondary: '#0369a1', // Darker Blue
    accent: '#38bdf8', // Light Blue
    dark: '#0f172a',
    light: '#f0f9ff', // Very Light Blue
    white: '#ffffff',
    text: '#1e293b',
    textLight: '#64748b',
    success: '#10b981',
    error: '#ef4444'
};

// --- Shared Styles ---
const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 900,
    marginBottom: '0.75rem',
    background: `linear-gradient(135deg, ${THEME.secondary}, ${THEME.primary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
    lineHeight: 1.1
};

const subtitleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    color: THEME.textLight,
    marginBottom: '2rem',
    fontWeight: 500,
    maxWidth: '800px'
};

const glassCardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: `1px solid ${THEME.light}`,
    transition: 'all 0.3s ease'
};

// --- Slide Components ---

export const CoverSlide = ({ slide }: { slide: SlideData }) => (
    <div style={{
        position: 'relative', width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', overflow: 'hidden', borderRadius: '32px', padding: '2rem',
        background: `linear-gradient(135deg, ${THEME.white}, ${THEME.light})`
    }}>
        {/* Background Decorative Elements */}
        <div style={{
            position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%',
            borderRadius: '50%', opacity: 0.2, filter: 'blur(80px)',
            background: THEME.primary, animation: 'float 8s infinite ease-in-out'
        }} />
        <div style={{
            position: 'absolute', bottom: '-10%', right: '-10%', width: '30%', height: '30%',
            borderRadius: '50%', opacity: 0.15, filter: 'blur(60px)',
            background: THEME.accent, animation: 'float 12s infinite ease-in-out reverse'
        }} />

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Branding badge */}
            <div style={{
                marginBottom: '1.5rem', padding: '0.4rem 1.25rem', borderRadius: '9999px',
                border: `1px solid ${THEME.primary}44`, background: `${THEME.primary}11`,
                color: THEME.secondary, fontWeight: 'bold',
                letterSpacing: '0.1em', fontSize: '0.75rem', textTransform: 'uppercase'
            }}>
                CREATEX 2026 • STARTUP TN • MKJC
            </div>

            <h1 style={{
                fontSize: '4rem', fontWeight: 900, color: THEME.dark, marginBottom: '1rem',
                lineHeight: 1.1, letterSpacing: '-0.04em'
            }}>
                {slide.title}
            </h1>

            <p style={{ fontSize: '1.25rem', color: THEME.textLight, fontWeight: 500, maxWidth: '750px', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                {slide.subtitle}
            </p>

            <div style={{ marginTop: '3rem', display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: '2rem', height: '0.25rem', background: THEME.accent, borderRadius: '9999px' }} />
                <div style={{ width: '4rem', height: '0.25rem', background: THEME.primary, borderRadius: '9999px' }} />
                <div style={{ width: '2rem', height: '0.25rem', background: THEME.secondary, borderRadius: '9999px' }} />
            </div>
        </div>

        <style jsx>{`
            @keyframes float {
                0%, 100% { transform: translate(0, 0) scale(1); }
                33% { transform: translate(15px, -25px) scale(1.05); }
                66% { transform: translate(-10px, 10px) scale(0.95); }
            }
        `}</style>
    </div>
);

export const ContentSlide = ({ slide }: { slide: SlideData }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '3rem', justifyContent: 'center', background: THEME.white }}>
        <h2 style={titleStyle}>{slide.title}</h2>
        {slide.subtitle && <p style={subtitleStyle}>{slide.subtitle}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', width: '100%' }}>
            {(slide.content as any[]).map((item, i) => {
                const Icon = item.icon ? ICON_MAP[item.icon] : Lightbulb;
                return (
                    <div key={i} style={{ ...glassCardStyle, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            padding: '1rem', borderRadius: '0.75rem',
                            background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
                            color: '#fff', display: 'flex', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.2)'
                        }}>
                            <Icon size={24} color="white" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: THEME.dark, marginBottom: '0.25rem' }}>{item.title}</h3>
                            <p style={{ fontSize: '1rem', color: THEME.textLight, lineHeight: 1.5 }}>{item.text}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export const ComparisonSlide = ({ slide }: { slide: SlideData }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '3rem', justifyContent: 'center', background: THEME.white }}>
        <h2 style={{ ...titleStyle, textAlign: 'center', width: '100%' }}>{slide.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
            {(slide.content as any[]).map((item, i) => (
                <div key={i} style={{ ...glassCardStyle, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{
                        width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                        background: i === 2 ? `${THEME.primary}22` : '#f1f5f9',
                        color: i === 2 ? THEME.primary : '#94a3b8'
                    }}>
                        {i === 2 ? <Rocket size={24} /> : <ZapOff size={24} />}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: THEME.dark, marginBottom: '1rem' }}>{item.title}</h3>
                    <p style={{ color: THEME.textLight, fontSize: '0.9rem', lineHeight: 1.5 }}>{item.text}</p>
                    {i === 2 && (
                        <div style={{
                            marginTop: 'auto', paddingTop: '1rem', color: THEME.primary,
                            fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase'
                        }}>
                            Top Choice
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
);

export const FeaturesSlide = ({ slide }: { slide: SlideData }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '3rem', justifyContent: 'center', background: THEME.white }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={titleStyle}>{slide.title}</h2>
            <p style={{ color: THEME.primary, fontWeight: 'bold', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {slide.subtitle}
            </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {(slide.content as any[]).map((item, i) => {
                const Icon = item.icon ? ICON_MAP[item.icon] : Monitor;
                return (
                    <div key={i} style={{ ...glassCardStyle, padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '10px', background: THEME.dark, color: '#fff', display: 'flex' }}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: THEME.dark, marginBottom: '0.15rem' }}>{item.title}</h3>
                            <p style={{ color: THEME.textLight, fontSize: '0.9rem' }}>{item.text}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export const ImageSlide = ({ slide }: { slide: SlideData }) => (
    <div style={{
        width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        borderRadius: '32px', background: THEME.light
    }}>
        <Image src={slide.image!} alt={slide.title} fill style={{ objectFit: 'contain', padding: '2rem' }} priority />
        <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(255, 255, 255, 0.9), transparent)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '3rem'
        }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: THEME.dark, marginBottom: '0.5rem' }}>{slide.title}</h2>
            <p style={{ fontSize: '1.1rem', color: THEME.textLight, fontWeight: 500 }}>{slide.caption}</p>
        </div>
    </div>
);

export const CardsSlide = ({ slide }: { slide: SlideData }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '3rem', justifyContent: 'center', background: THEME.white }}>
        <h2 style={{ ...titleStyle, textAlign: 'center', width: '100%' }}>{slide.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
            {(slide.content as any[]).map((item, i) => (
                <div key={i} style={{ ...glassCardStyle, padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: THEME.primary, marginBottom: '1rem' }}>{item.title}</h3>
                    <p style={{ color: THEME.textLight, lineHeight: 1.5, fontSize: '0.95rem' }}>{item.text}</p>
                    <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', gap: '0.4rem' }}>
                        {[1, 2, 3].map(j => <div key={j} style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', background: THEME.light }} />)}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const StatsSlide = ({ slide }: { slide: SlideData }) => (
    <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '3rem', borderRadius: '32px',
        background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.accent})`
    }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '4rem', letterSpacing: '-0.02em' }}>{slide.title}</h2>
        <div style={{ display: 'flex', gap: '4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {(slide.stats as any[]).map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        fontSize: '4rem', fontWeight: 900, color: '#fff',
                        marginBottom: '0.5rem'
                    }}>
                        {stat.value}
                    </div>
                    <div style={{
                        color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', textTransform: 'uppercase',
                        letterSpacing: '0.2rem', fontSize: '0.75rem', paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.3)', width: '100%', paddingLeft: '1rem', paddingRight: '1rem'
                    }}>
                        {stat.label}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const TimelineSlide = ({ slide }: { slide: SlideData }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '3rem', justifyContent: 'center', background: THEME.white }}>
        <h2 style={{ ...titleStyle, textAlign: 'center', width: '100%', marginBottom: '4rem' }}>{slide.title}</h2>
        <div style={{ position: 'relative', width: '100%', maxWidth: '900px', margin: '0 auto', padding: '2rem 0' }}>
            {/* Timeline Line */}
            <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', background: THEME.light, transform: 'translateY(-50%)' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', position: 'relative', zIndex: 10 }}>
                {(slide.timeline as any[]).map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: '3.5rem', height: '3.5rem', borderRadius: '50%', border: '3px solid #fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                            fontWeight: 900, fontSize: '1.25rem', boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                            background: i === 0 ? THEME.success : THEME.primary
                        }}>
                            {i + 1}
                        </div>
                        <div style={{ ...glassCardStyle, marginTop: '1.5rem', padding: '1.25rem', textAlign: 'center', width: '100%' }}>
                            <h4 style={{ fontWeight: 900, color: THEME.primary, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>{item.phase}</h4>
                            <p style={{ color: THEME.textLight, fontSize: '0.8rem', fontWeight: 500 }}>{item.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const ListSlide = ({ slide }: { slide: SlideData }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '3rem', justifyContent: 'center', alignItems: 'center', background: THEME.white }}>
        <h2 style={titleStyle}>{slide.title}</h2>
        <div style={{ marginTop: '2.5rem', width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(slide.content as string[]).map((item, i) => (
                <div key={i} style={{ ...glassCardStyle, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        width: '2rem', height: '2rem', borderRadius: '50%', background: '#d1fae5',
                        color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <CheckCircle size={16} />
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: THEME.dark }}>{item}</span>
                </div>
            ))}
        </div>
    </div>
);

export const TeamSlide = ({ slide }: { slide: SlideData }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '3rem', justifyContent: 'center', background: THEME.white }}>
        <h2 style={{ ...titleStyle, textAlign: 'center', width: '100%' }}>{slide.title}</h2>
        <p style={{ textAlign: 'center', color: THEME.textLight, marginBottom: '3rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
            {slide.subtitle}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {(slide.team as any[]).map((member, i) => (
                <div key={i} style={{ ...glassCardStyle, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{
                        width: '6rem', height: '6rem', borderRadius: '1.5rem', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem',
                        fontWeight: 900, marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                        background: member.gender === 'M' ? `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})` : `linear-gradient(135deg, #a855f7, #db2777)`
                    }}>
                        {member.name.charAt(0)}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: THEME.dark, marginBottom: '0.4rem' }}>{member.name}</h3>
                    <p style={{
                        fontSize: '0.65rem', fontWeight: 900, color: THEME.primary, textTransform: 'uppercase',
                        letterSpacing: '0.1em', padding: '0.2rem 0.75rem', borderRadius: '9999px', background: `${THEME.primary}11`
                    }}>
                        {member.role}
                    </p>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                        <div style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', background: THEME.light }} />
                        <div style={{ width: '1.5rem', height: '0.4rem', borderRadius: '9999px', background: THEME.primary }} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);
