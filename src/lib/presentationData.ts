import {
    Zap, ShieldCheck, Globe, Users, Monitor,
    TrendingUp, Cpu, Award, ZapOff, CheckCircle,
    BarChart3, Layers, Layout, Lock, GraduationCap,
    Lightbulb, Target, Rocket, Users2
} from 'lucide-react';

export interface SlideData {
    slug: string;
    title: string;
    subtitle?: string;
    type: 'cover' | 'content' | 'comparison' | 'features' | 'image' | 'cards' | 'stats' | 'timeline' | 'list' | 'team';
    content?: any;
    image?: string;
    caption?: string;
    stats?: { value: string; label: string }[];
    timeline?: { phase: string; text: string }[];
    team?: { name: string; role: string; gender: 'M' | 'F' }[];
}

export const PRESENTATION_DATA: SlideData[] = [
    {
        slug: 'intro',
        title: 'Team KWIDS: AR Electronics Lab',
        subtitle: 'CREATEX 2026: Revolutionizing STEM Education\nImmersive • Multilingual • AI-Powered',
        type: 'cover'
    },
    {
        slug: 'problem',
        title: 'The "Practical Gap" in Education',
        subtitle: 'Why Rural STEM Education is Stagnating',
        type: 'content',
        content: [
            { icon: 'ZapOff', title: 'Infrastructure Deficit', text: '₹394Cr spent on labs, but maintenance is zero. Virtual labs are the only cost-effective solution.' },
            { icon: 'ShieldCheck', title: 'The Safety Barrier', text: 'Real-world ECE/EEE practicals involve risks. KWIDS provides a 100% risk-free 3D sandbox.' },
            { icon: 'Globe', title: 'The Language Wall', text: '90% of STEM content is in English. We break this wall for millions of Tamil and Regional medium students.' }
        ]
    },
    {
        slug: 'comparison',
        title: 'Why KWIDS is Different',
        subtitle: 'Beyond Tinkercad: True Spatial Learning',
        type: 'comparison',
        content: [
            { title: 'Physical Labs', text: 'Expensive, easy to damage, impossible for individual home-study.' },
            { title: 'Tinkercad / 2D', text: 'Simple browser simulation. No AR, no local languages, no real-world link.' },
            { title: 'KWIDS (3D/AR)', text: 'Immersive AR, AI Vision for components, and Voice Agents in 9+ languages.' }
        ]
    },
    {
        slug: 'innovation-kyc',
        title: 'Know Your Component (KYC)',
        subtitle: 'AI-Powered Visual Recognition',
        type: 'features',
        content: [
            { icon: 'Cpu', title: 'Point & Identify', text: 'Use your camera to recognize real-world components instantly.' },
            { icon: 'Layers', title: 'Interactive Specs', text: 'Get pinouts, ratings, and usage guides visually overlaid on the part.' },
            { icon: 'Monitor', title: 'Bridge to Reality', text: 'Connects the virtual 3D world with the physical hardware on your desk.' },
            { icon: 'Zap', title: 'Instant Context', text: 'No more searching for datasheets; the information follows the component.' }
        ]
    },
    {
        slug: 'innovation-voice',
        title: 'Multilingual Voice Agents',
        subtitle: 'Your Personal Hands-Free Lab Assistant',
        type: 'content',
        content: [
            { icon: 'Users', title: 'Natural Language STT', text: 'Control the lab with voice commands like "Delete", "Add Resistor" in your mother tongue.' },
            { icon: 'GraduationCap', title: 'Interactive TTS', text: 'KWIDS talks back! Step-by-step experiment guidance in 9+ Regional languages.' },
            { icon: 'Globe', title: 'Inclusive Design', text: 'First-of-its-kind support for Tamil, Telugu, Hindi, and more in an AR Lab.' }
        ]
    },
    {
        slug: 'usp',
        title: 'The KWIDS Edge',
        type: 'cards',
        content: [
            { title: 'True 3D/AR', text: 'Built on a high-fidelity 3D engine for realistic ECE/EEE practical exposure.' },
            { title: 'Vernacular First', text: 'Entire UI and logic localized for State Board and Rural accessibility.' },
            { title: 'AI-Integrated', text: 'Vision and Voice agents transform a "tool" into an "intelligent assistant".' }
        ]
    },
    {
        slug: 'market',
        title: 'Market & Scalability',
        type: 'stats',
        stats: [
            { value: '$29B', label: 'Immersive EduTech Market (2032)' },
            { value: '260M+', label: 'Potential K-12 Users in India' },
            { value: '0', label: 'Additional Hardware Cost' }
        ]
    },
    {
        slug: 'prototype',
        title: 'Prototype Demo',
        type: 'image',
        image: '/slide_proto_1.png',
        caption: 'Realistic ECE/EEE Modules: Interactive Breadboard with LEDs, Motors, Potentiometers & Voice Control'
    },
    {
        slug: 'execution',
        title: 'The Roadmap',
        type: 'timeline',
        timeline: [
            { phase: 'Phase 1', text: 'Pilot testing in 10 Rural Schools across Tamil Nadu.' },
            { phase: 'Phase 2', text: 'Expanding to higher-level ECE/EEE (University level) modules.' },
            { phase: 'Phase 3', text: 'AI-driven personalized learning paths for individual students.' }
        ]
    },
    {
        slug: 'traction',
        title: 'Validation & Team',
        type: 'list',
        content: [
            'Tested with 100+ students; 92% found AR more engaging than 2D.',
            'Zero-cost deployment on existing school laboratory PCs.',
            'Identified as high-impact for StartupTN Rural Mission.'
        ]
    },
    {
        slug: 'team',
        title: 'The Team: KWIDS',
        subtitle: 'Founders of the Future Classroom',
        type: 'team',
        team: [
            { name: 'Partha sarathi R', role: 'CHIEF ARCHITECT (TECH)', gender: 'M' },
            { name: 'Mohammed Fazil S', role: 'AR/VR DEVELOPER', gender: 'M' },
            { name: 'Rifat N', role: 'PRODUCT DESIGN (UX)', gender: 'M' }
        ]
    }
];
