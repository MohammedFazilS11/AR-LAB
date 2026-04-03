'use client';

import React, { useState } from 'react';
import { useLanguage, Language } from '@/lib/LanguageContext';

interface LoginPageProps {
    onLogin: (experiment: string) => void;
}

const EXPERIMENTS = [
    { id: 'led-battery', key: 'exp.led' },
    { id: 'motor-battery', key: 'exp.motor' },
    { id: 'series-resistor', key: 'exp.series' },
    { id: 'buzzer-alarm', key: 'exp.buzzer' },
];

const LANGUAGES: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'mr', label: 'मराठी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'gu', label: 'ગુજરાતી' },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
    const { t, language, setLanguage } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [experiment, setExperiment] = useState('');
    const [showLangMenu, setShowLangMenu] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            onLogin(""); // Login successful, will show selection next
        }
    };

    return (
        <div style={{
            width: '100vw', height: '100vh',
            background: '#f8f9fa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Outfit", sans-serif',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Background Video (Electrical Experiments Focus) */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, background: '#111 url("https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=2069&auto=format&fit=crop") center/cover no-repeat' }}>
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    poster="https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=2069&auto=format&fit=crop"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        minWidth: '100%',
                        minHeight: '100%',
                        objectFit: 'cover',
                        opacity: 1, // Let the overlay handle darkening
                    }}
                >
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-motherboard-with-neon-lights-and-a-processor-chip-43093-large.mp4" type="video/mp4" />
                </video>
                {/* Dark Overlay for Readability */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.55)', zIndex: 1 }} />
            </div>

            {/* Main Glassmorphism Card */}
            <div style={{
                width: '100%', maxWidth: 440, padding: '48px 40px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                borderRadius: 24,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
                position: 'relative', zIndex: 10,
                color: '#fff',
            }}>
                {/* Logo / Title */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 64, height: 64, borderRadius: 18,
                        background: 'linear-gradient(135deg, rgba(0,187,238,0.8), rgba(0,119,204,0.8))',
                        boxShadow: '0 8px 32px rgba(0,187,238,0.4)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        fontSize: '1.8rem', marginBottom: 16,
                        backdropFilter: 'blur(4px)'
                    }}>⚡</div>
                    <h1 style={{
                        fontSize: '1.6rem', fontWeight: 900, color: '#fff',
                        margin: '0 0 6px 0', letterSpacing: '-0.5px',
                    }}>{t('login.title')}</h1>
                    <p style={{
                        fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)',
                        margin: 0, fontWeight: 500,
                    }}>{t('login.subtitle')}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <label style={{ display: 'block', marginBottom: 20 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '1px', textTransform: 'uppercase' }}>{t('login.email')}</span>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={t('login.emailPlaceholder')}
                            required
                            style={{
                                width: '100%', padding: '14px 16px', marginTop: 6,
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 14, color: '#fff', fontSize: '0.95rem',
                                outline: 'none', fontFamily: 'inherit',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box',
                            }}
                            onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.borderColor = 'rgba(0,187,238,0.6)'; e.target.style.boxShadow = '0 0 0 4px rgba(0,187,238,0.2)'; }}
                            onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.boxShadow = 'none'; }}
                        />
                    </label>

                    {/* Password */}
                    <label style={{ display: 'block', marginBottom: 32 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '1px', textTransform: 'uppercase' }}>{t('login.password')}</span>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={t('login.passwordPlaceholder')}
                            required
                            style={{
                                width: '100%', padding: '14px 16px', marginTop: 6,
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 14, color: '#fff', fontSize: '0.95rem',
                                outline: 'none', fontFamily: 'inherit',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box',
                            }}
                            onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.borderColor = 'rgba(0,187,238,0.6)'; e.target.style.boxShadow = '0 0 0 4px rgba(0,187,238,0.2)'; }}
                            onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.boxShadow = 'none'; }}
                        />
                    </label>

                    {/* Submit */}
                    <button
                        type="submit"
                        style={{
                            width: '100%', padding: '14px',
                            background: 'linear-gradient(135deg, rgba(0,187,238,0.9), rgba(0,119,204,0.9))',
                            border: '1px solid rgba(255,255,255,0.3)', borderRadius: '14px', color: '#fff',
                            fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(0,187,238,0.4)',
                            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                            transition: 'all 0.3s ease',
                            fontFamily: 'inherit', letterSpacing: '1px',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,187,238,0.6)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,187,238,0.4)'; }}
                    >
                        {t('login.start')} →
                    </button>
                </form>
            </div>

            {/* Settings / Language Button — Bottom Left */}
            <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 1000 }}>
                <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                        transition: 'transform 0.2s, background 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                >⚙️</button>

                {/* Language Popup */}
                {showLangMenu && (
                    <div style={{
                        position: 'absolute', bottom: 60, left: 0,
                        background: 'rgba(20,20,40,0.95)',
                        backdropFilter: 'blur(30px)',
                        borderRadius: 16, padding: '12px 8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                        minWidth: 180,
                    }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', padding: '4px 12px 8px', textTransform: 'uppercase' }}>
                            {t('settings.title')}
                        </div>
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                                style={{
                                    display: 'block', width: '100%', padding: '10px 12px',
                                    background: language === lang.code ? 'rgba(0,187,238,0.15)' : 'transparent',
                                    border: 'none', borderRadius: 10, color: '#fff',
                                    fontSize: '0.9rem', fontWeight: language === lang.code ? 800 : 500,
                                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { if (language !== lang.code) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                onMouseLeave={e => { if (language !== lang.code) e.currentTarget.style.background = 'transparent'; }}
                            >
                                {language === lang.code && <span style={{ color: '#00bbee', marginRight: 8 }}>●</span>}
                                {lang.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Project Creator Credit */}
            <div style={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
                color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600,
                letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
                Project by Mohammed Fazil S
            </div>

            {/* Animations */}
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800;900&display=swap');
        body { margin: 0; }
        @keyframes float0 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, -30px); } }
        @keyframes float1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-25px, 20px); } }
        @keyframes float2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(15px, 25px); } }
        @keyframes float3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, -15px); } }
        @keyframes float4 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(25px, 15px); } }
        @keyframes float5 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-15px, 25px); } }
      `}</style>
        </div>
    );
}
