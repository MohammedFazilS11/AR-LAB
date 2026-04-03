'use client';

import { Language } from './LanguageContext';

const LANG_MAP: Record<Language, string> = {
    en: 'en-US',
    ta: 'ta-IN',
    te: 'te-IN',
    ml: 'ml-IN',
    hi: 'hi-IN',
    kn: 'kn-IN',
    mr: 'mr-IN',
    bn: 'bn-IN',
    gu: 'gu-IN',
};

// Command keywords for each language
export const VOICE_COMMANDS: Record<Language, Record<string, string[]>> = {
    en: {
        delete: ['delete', 'remove', 'erase', 'clear'],
        reset: ['reset', 'restart', 'start over'],
        kyc: ['kyc', 'identify', 'what is this', 'scan'],
        settings: ['settings', 'options', 'gear'],
        help: ['help', 'guide', 'instructions'],
        breadboard: ['breadboard', 'board'],
        led: ['led', 'light'],
        battery: ['battery', 'power'],
        resistor: ['resistor'],
    },
    ta: {
        delete: ['நீக்கு', 'அழி', 'அகற்று'],
        reset: ['மீண்டும்', 'ஆரம்பம்'],
        kyc: ['இது என்ன', 'அடையாளம்', 'கே ஒய் சி'],
        settings: ['அமைப்புகள்', 'மாற்று'],
        help: ['உதவி', 'வழிமுறை'],
        breadboard: ['பலகை', 'பிரட்போர்டு'],
        led: ['விளக்கு', 'எல் இ டி'],
        battery: ['மின்கலம்', 'பேட்டரி'],
        resistor: ['மின்தடை'],
    },
    // Adding more languages as placeholders or full mapping later
    te: { delete: ['తొలగించు'], reset: ['మళ్ళీ'], kyc: ['గుర్తించు'], help: ['సహాయం'] },
    ml: { delete: ['നീക്കം ചെയ്യുക'], reset: ['വീണ്ടും'], kyc: ['തിരിച്ചറിയുക'], help: ['സഹായം'] },
    hi: { delete: ['हटाएं', 'मिटाएं'], reset: ['पुनः आरंभ करें'], kyc: ['पहचाने', 'स्कैन'], help: ['मदद'] },
    kn: { delete: ['ತೆಗೆದುಹಾಕಿ'], reset: ['ಮತ್ತೆ'], kyc: ['ಗುರುತಿಸಿ'], help: ['ಸಹಾಯ'] },
    mr: { delete: ['काढून टाका'], reset: ['पुन्हा'], kyc: ['ओळखा'], help: ['मदत'] },
    bn: { delete: ['মুছে ফেলুন'], reset: ['রিসেট'], kyc: ['সনাক্ত করুন'], help: ['সাহায্য'] },
    gu: { delete: ['કાઢી નાખો'], reset: ['ફરીથી'], kyc: ['ઓળખો'], help: ['મદદ'] },
};

class VoiceSystem {
    private synthesis: SpeechSynthesis | null = null;
    private recognition: any = null;
    private isListening: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.synthesis = window.speechSynthesis;
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = false;
            }
        }
    }

    speak(text: string, lang: Language = 'en') {
        if (!this.synthesis) return;

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANG_MAP[lang];
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to find a better voice for the language
        const voices = this.synthesis.getVoices();
        const langCode = LANG_MAP[lang];
        const preferredVoice = voices.find(v => v.lang.startsWith(langCode));
        if (preferredVoice) utterance.voice = preferredVoice;

        this.synthesis.speak(utterance);
    }

    startListening(lang: Language, onCommand: (command: string) => void) {
        if (!this.recognition) return;

        this.recognition.lang = LANG_MAP[lang];
        this.recognition.onresult = (event: any) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript.toLowerCase().trim();
            console.log('Voice recognized:', text);

            // Check against commands
            const commands = VOICE_COMMANDS[lang] || VOICE_COMMANDS.en;
            for (const [cmdKey, phrases] of Object.entries(commands)) {
                if (phrases.some(p => text.includes(p))) {
                    console.log('Action triggered:', cmdKey);
                    onCommand(cmdKey);
                    return;
                }
            }
        };

        this.recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'no-speech') return;
            this.stopListening();
        };

        try {
            this.recognition.start();
            this.isListening = true;
        } catch (e) {
            console.error('Recognition already started');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    toggleListening(lang: Language, onCommand: (command: string) => void) {
        if (this.isListening) {
            this.stopListening();
            return false;
        } else {
            this.startListening(lang, onCommand);
            return true;
        }
    }
}

export const voiceSystem = new VoiceSystem();
