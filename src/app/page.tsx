'use client';

import { useState } from 'react';
import { LanguageProvider, useLanguage, Language } from '@/lib/LanguageContext';
import LoginPage from '@/components/LoginPage';
import ElectronicsLab from '@/components/ElectronicsLab';

function ExperimentPlaceholder({ experiment, onBack }: { experiment: string; onBack: () => void }) {
  const { t } = useLanguage();

  const expNames: Record<string, string> = {
    'motor-battery': 'exp.motor',
    'series-resistor': 'exp.series',
    'buzzer-alarm': 'exp.buzzer',
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Outfit", sans-serif', color: '#fff',
    }}>
      <div style={{
        textAlign: 'center', padding: '60px 40px',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(40px)',
        borderRadius: 28, border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        maxWidth: 480,
      }}>
        <div style={{ fontSize: '4rem', marginBottom: 20 }}>🔧</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 8px 0' }}>
          {t(expNames[experiment] || 'placeholder.title')}
        </h1>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#00bbee', margin: '0 0 16px 0' }}>
          {t('placeholder.title')}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 32px 0', lineHeight: 1.6 }}>
          {t('placeholder.desc')}
        </p>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px', background: 'rgba(0,187,238,0.15)',
            border: '1px solid rgba(0,187,238,0.4)', borderRadius: '14px', color: '#fff',
            fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,187,238,0.2)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,187,238,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,187,238,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {t('placeholder.back')}
        </button>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800;900&display=swap');
        body { margin: 0; }
      `}</style>
    </div>
  );
}

function ExperimentSelectionPage({ onSelect }: { onSelect: (id: string) => void }) {
  const { t, language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const experiments = [
    { id: 'led-battery', icon: '💡', title: 'exp.led', color: '#00bbee', desc: 'Basic circuit connecting an LED to a 9V battery with a resistor.' },
    { id: 'motor-battery', icon: '⚙️', title: 'exp.motor', color: '#ff4444', desc: 'Power a DC motor using a switch and battery to create motion.' },
    { id: 'series-resistor', icon: '🔋', title: 'exp.series', color: '#ffa500', desc: 'Connect resistors in series to limit the current flowing to an LED.' },
    { id: 'buzzer-alarm', icon: '🔔', title: 'exp.buzzer', color: '#22cc44', desc: 'Create a simple sound alarm circuit using a buzzer and switch.' },
    { id: 'pot-motor', icon: '🌀', title: 'exp.pot-motor', color: '#8844ff', desc: 'Use a potentiometer to control the speed of a DC fan horizontally.' },
    { id: 'pot-led', icon: '🔆', title: 'exp.pot-led', color: '#ffea00', desc: 'Control the brightness of an LED using a variable resistor.' },
    { id: 'parallel-led', icon: '🚦', title: 'exp.parallel-led', color: '#00eebb', desc: 'Wire two LEDs in parallel so they share the same voltage.' },
    { id: 'switch-motor', icon: '⚡', title: 'exp.switch-motor', color: '#ff00aa', desc: 'Operate a DC motor with direct toggle control using a switch.' },
    { id: 'series-circuit', icon: '🔗', title: 'exp.series-combined', color: '#4444ff', desc: 'Combine multiple components in series.' },
    { id: 'smart-doorbell', icon: '🚪', title: 'exp.smart-doorbell', color: '#bb44bb', desc: 'Build a doorbell circuit that triggers both light and sound simultaneously.' },
  ];

  const languages: { code: Language; label: string }[] = [
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

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#f8f9fa',
      fontFamily: '"Outfit", sans-serif', color: '#111',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px', boxSizing: 'border-box', overflow: 'auto',
      position: 'relative'
    }}>
      {/* Background elements for glass effect */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(0,187,238,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(255,68,68,0.1) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ 
          fontSize: '3.2rem', fontWeight: 900, margin: '0 0 12px 0', color: '#0a0a1a',
          fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          letterSpacing: '-1px'
        }}>{t('login.selectionTitle')}</h1>
        <p style={{ fontSize: '1.2rem', color: '#555', margin: 0, fontWeight: 500 }}>{t('login.selectionSubtitle')}</p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        maxWidth: '900px'
      }}>
        {experiments.map(exp => (
          <div
            key={exp.id}
            onClick={() => onSelect(exp.id)}
            style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '24px 32px',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 16px 32px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
              e.currentTarget.style.borderColor = exp.color;
              e.currentTarget.style.boxShadow = `0 20px 40px -10px ${exp.color}44`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
              e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{
              fontSize: '3.5rem', marginRight: '24px',
              background: `rgba(0,0,0,0.03)`,
              minWidth: '90px', height: '90px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '20px',
              border: `1px solid rgba(0,0,0,0.05)`,
              flexShrink: 0
            }}>{exp.icon}</div>
            
            <div style={{ flex: 1, paddingRight: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', color: '#111' }}>{t(exp.title)}</h3>
              <p style={{ fontSize: '0.9rem', color: '#555', margin: 0, fontWeight: 500 }}>{exp.desc}</p>
            </div>

            <div 
              className="glass-btn"
              style={{
              padding: '10px 24px', background: `${exp.color}15`,
              color: exp.color, borderRadius: '24px', fontSize: '0.85rem',
              fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
              boxShadow: `0 4px 12px ${exp.color}22`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${exp.color}40`,
              transition: 'all 0.2s',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}>Start Lab →</div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .glass-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      `}</style>

      <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 1000 }}>
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,0,0,0.1)',
            color: '#333', fontSize: '1.2rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
        >⚙️</button>

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
            {languages.map(lang => (
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
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<'login' | 'selection' | 'lab' | 'placeholder'>('login');
  const [selectedExperiment, setSelectedExperiment] = useState('');

  const handleLogin = () => {
    setCurrentView('selection');
  };

  const handleSelectExperiment = (experiment: string) => {
    setSelectedExperiment(experiment);
    setCurrentView('lab');
  };

  const handleBack = () => {
    if (currentView === 'lab') {
      setCurrentView('selection');
    } else {
      setCurrentView('login');
      setSelectedExperiment('');
    }
  };

  if (currentView === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentView === 'selection') {
    return <ExperimentSelectionPage onSelect={handleSelectExperiment} />;
  }

  if (currentView === 'lab') {
    return <ElectronicsLab onBack={handleBack} experimentId={selectedExperiment} />;
  }

  return <ExperimentPlaceholder experiment={selectedExperiment} onBack={handleBack} />;
}

export default function Home() {
  return (
    <LanguageProvider>
      <main>
        <AppContent />
      </main>
    </LanguageProvider>
  );
}
