'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage, Language } from '@/lib/LanguageContext';
import { voiceSystem } from '@/lib/voiceSystem';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

interface KYCModalProps {
    onClose: () => void;
}

export default function KYCModal({ onClose }: KYCModalProps) {
    const { t, language } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [model, setModel] = useState<any>(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const requestRef = useRef<number>(null);

    // Component Mapping for electronic parts
    const mapResult = (predictions: any[]) => {
        if (!predictions || predictions.length === 0) return null;

        // Find the best match among electronic components
        const keywords: Record<string, string[]> = {
            'Hi-Watt Battery': ['battery', 'voltage', 'accumulator', 'cell', 'power supply', 'hi-watt', '8f22'],
            '220 Ohm Resistor': ['resistor', 'electronic component'],
            'LED Diode': ['led', 'light bulb', 'diode', 'lamp', 'light-emitting diode'],
            'Push Button': ['switch', 'toggle', 'button', 'keypad'],
            'Breadboard': ['breadboard', 'prototyping board', 'electronics', 'circuit board'],
            'DC Motor': ['motor', 'engine', 'rotor', 'fan'],
            'Piezo Buzzer': ['buzzer', 'speaker', 'audio', 'piezo'],
            'Potentiometer': ['dial', 'knob', 'potentiometer', 'rheostat'],
        };

        for (const prediction of predictions) {
            const label = prediction.className.toLowerCase();
            for (const [component, terms] of Object.entries(keywords)) {
                if (terms.some(term => label.includes(term))) {
                    return component;
                }
            }
        }

        // Return top prediction if no specific match
        return predictions[0].className.split(',')[0];
    };

    useEffect(() => {
        async function initAI() {
            try {
                await tf.ready();
                const loadedModel = await mobilenet.load({ version: 2, alpha: 1.0 });
                setModel(loadedModel);
                setIsModelLoading(false);
            } catch (err) {
                console.error("AI Model failed to load:", err);
                setError("AI Model could not be loaded. Please check your connection.");
            }
        }
        initAI();
    }, []);

    const detect = useCallback(async () => {
        if (!model || !videoRef.current || videoRef.current.readyState !== 4 || !!capturedImage) {
            requestRef.current = requestAnimationFrame(detect);
            return;
        }

        try {
            const predictions = await model.classify(videoRef.current);
            const identified = mapResult(predictions);
            if (identified) {
                setResult(identified);
            }
        } catch (err) {
            console.error("Detection error:", err);
        }

        requestRef.current = requestAnimationFrame(detect);
    }, [model, capturedImage]);

    // Voice feedback when result changes
    useEffect(() => {
        if (result && !isModelLoading) {
            voiceSystem.speak(result, language);
        }
    }, [result, isModelLoading, language]);

    useEffect(() => {
        if (!isModelLoading && model) {
            requestRef.current = requestAnimationFrame(detect);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isModelLoading, model, detect]);

    useEffect(() => {
        async function startCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Camera access denied or not available.");
            }
        }
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const captureAndIdentify = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
        }
    };

    const reset = () => {
        setCapturedImage(null);
        setResult(null);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, color: 'white', fontFamily: 'Outfit, sans-serif'
        }}>
            <div style={{
                width: '90%', maxWidth: '600px', background: '#1a1a2e',
                borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{t('kyc.title')}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                            width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                            fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >✕</button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                    {error ? (
                        <div style={{ textAlign: 'center', color: '#ff4444' }}>{error}</div>
                    ) : (
                        <div style={{
                            width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: '16px',
                            overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                        }}>
                            {!capturedImage ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}

                            {isModelLoading && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', flexDirection: 'column', gap: '15px', zIndex: 10
                                }}>
                                    <div className="spinner" style={{
                                        width: '50px', height: '50px', border: '5px solid rgba(255,255,255,0.1)',
                                        borderTopColor: '#00bbee', borderRadius: '50%', animation: 'spin 1s linear infinite'
                                    }} />
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#00bbee', letterSpacing: '1px' }}>LOADING AI MODEL...</span>
                                </div>
                            )}

                            {!isModelLoading && !capturedImage && (
                                <div style={{
                                    position: 'absolute', top: '15px', right: '15px',
                                    background: 'rgba(0,187,238,0.2)', padding: '6px 14px',
                                    borderRadius: '20px', border: '1px solid #00bbee',
                                    display: 'flex', alignItems: 'center', gap: '8px', zIndex: 5
                                }}>
                                    <div style={{ width: '8px', height: '8px', background: '#00ff00', borderRadius: '50%', boxShadow: '0 0 10px #00ff00' }} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', color: '#00bbee' }}>REAL-TIME AI ACTIVE</span>
                                </div>
                            )}

                            {result && (
                                <div style={{
                                    position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                                    background: 'linear-gradient(135deg, rgba(0,187,238,0.95), rgba(0,136,204,0.95))',
                                    padding: '16px 32px', borderRadius: '20px',
                                    boxShadow: '0 15px 35px rgba(0,0,0,0.4)', fontWeight: 900, fontSize: '1.4rem',
                                    textAlign: 'center', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    color: '#fff', border: '1px solid rgba(255,255,255,0.2)', zIndex: 5
                                }}>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.8, letterSpacing: '2px', marginBottom: '4px' }}>IDENTIFIED:</div>
                                    {result.toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        {!capturedImage ? (
                            <button
                                onClick={captureAndIdentify}
                                style={{
                                    flex: 1, background: 'linear-gradient(135deg, #00bbee, #0088cc)',
                                    color: 'white', border: 'none', padding: '16px', borderRadius: '16px',
                                    fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(0,187,238,0.3)', transition: 'transform 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                📸 {t('kyc.capture')}
                            </button>
                        ) : (
                            <button
                                onClick={reset}
                                style={{
                                    flex: 1, background: 'rgba(255,255,255,0.1)',
                                    color: 'white', border: 'none', padding: '16px', borderRadius: '16px',
                                    fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            >
                                🔄 {t('kyc.tryAgain') || 'Resume AI'}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.6)', border: 'none', padding: '16px 24px', borderRadius: '16px',
                                fontSize: '1rem', fontWeight: 800, cursor: 'pointer'
                            }}
                        >
                            {t('kyc.close')}
                        </button>
                    </div>
                </div>

                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes popIn {
                    from { transform: translate(-50%, 40px) scale(0.8); opacity: 0; }
                    to { transform: translate(-50%, 0) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
