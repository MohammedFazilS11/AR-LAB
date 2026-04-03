'use client';

import React, { useState, useRef, Suspense, useEffect, useMemo, useCallback } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Text, RoundedBox, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { solveCircuit, ComponentData, CircuitState, ComponentType, WireData, Pin } from '@/lib/circuitSimulator';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useLanguage, Language } from '@/lib/LanguageContext';
import KYCModal from './KYCModal';
import { voiceSystem } from '@/lib/voiceSystem';

// --- Constants ---
const PITCH = 0.25; // 0.1" = 2.54mm scaled
const SNAP = (val: number) => Math.round(val / PITCH) * PITCH;
const BB_POS: [number, number, number] = [0, 0, 0]; // Breadboard is always at origin

// ============================================================
//  GUIDED TUTORIAL STEPS
// ============================================================
// ============================================================
//  INTERACTIVE GHOST GUIDE SYSTEM
// ============================================================

type GuideStep = {
    id: string;
    instruction: string;
    requiredComponent: 'Battery' | 'Resistor' | 'LED' | 'Switch' | 'Wire' | 'Breadboard' | 'Motor' | 'Buzzer' | 'Potentiometer';
    targetPos: [number, number, number]; // Correct snapped position
    guideKey: string;
    arrowOffset?: [number, number, number]; // Where the arrow points from
    wireEndPos?: [number, number, number]; // For wires
};

// "Happy Path" circuit coordinates (calculated for PITCH=0.25)
const GUIDE_DATA: Record<string, GuideStep[]> = {
    'led-battery': [
        { id: 'place-breadboard', instruction: "Step 1: Place the Breadboard.", requiredComponent: 'Breadboard', targetPos: [0, 0, 0], guideKey: 'guide.step0' },
        { id: 'place-battery', instruction: "Step 2: Place the Battery on the left.", requiredComponent: 'Battery', targetPos: [-6, 0.25, 2.625], guideKey: 'guide.step1' },
        { id: 'place-switch', instruction: "Step 3: Place the Switch in the center.", requiredComponent: 'Switch', targetPos: [-2, 0.25, 0.375], guideKey: 'guide.step2' },
        { id: 'place-resistor', instruction: "Step 4: Place the Resistor to the right of the switch.", requiredComponent: 'Resistor', targetPos: [0, 0.25, 0.375], guideKey: 'guide.step3' },
        { id: 'place-led', instruction: "Step 5: Place the LED. (Long leg right!)", requiredComponent: 'LED', targetPos: [2.125, 0.25, 0.375], guideKey: 'guide.step4' },
        { id: 'wire-1', instruction: "Step 6: Connect Battery (+ Red) to Switch input.", requiredComponent: 'Wire', targetPos: [-5.25, 0.22, 2.125], wireEndPos: [-2.25, 0.22, 0.375], guideKey: 'guide.step5' },
        { id: 'wire-2', instruction: "Step 7: Connect Switch output to Resistor.", requiredComponent: 'Wire', targetPos: [-1.75, 0.22, 0.375], wireEndPos: [-0.5, 0.22, 0.375], guideKey: 'guide.step6' },
        { id: 'wire-3', instruction: "Step 8: Connect Resistor to LED Anode (+).", requiredComponent: 'Wire', targetPos: [0.5, 0.22, 0.375], wireEndPos: [2.25, 0.22, 0.375], guideKey: 'guide.step7' },
        { id: 'wire-4', instruction: "Step 9: Connect LED Cathode (-) to Battery (- Black).", requiredComponent: 'Wire', targetPos: [2.0, 0.22, 0.375], wireEndPos: [-6.75, 0.22, 2.625], guideKey: 'guide.step8' },
    ],
    'motor-battery': [
        { id: 'place-breadboard', instruction: "Step 1: Place the Breadboard.", requiredComponent: 'Breadboard', targetPos: [0, 0, 0], guideKey: 'guide.step0' },
        { id: 'place-battery', instruction: "Step 2: Place the Battery on the left.", requiredComponent: 'Battery', targetPos: [-6, 0.25, 2.625], guideKey: 'guide.step1' },
        { id: 'place-switch', instruction: "Step 3: Place the Switch in the center.", requiredComponent: 'Switch', targetPos: [-2, 0.25, 0.375], guideKey: 'guide.step2' },
        { id: 'place-motor', instruction: "Step 4: Place the DC Motor.", requiredComponent: 'Motor', targetPos: [2, 0.25, 0.375], guideKey: 'guide.motor.step1' },
        { id: 'wire-1', instruction: "Step 5: Connect Battery (+ Red) to Switch input.", requiredComponent: 'Wire', targetPos: [-5.25, 0.22, 2.125], wireEndPos: [-2.25, 0.22, 0.375], guideKey: 'guide.step5' },
        { id: 'wire-2', instruction: "Step 6: Connect Switch output to Motor Pin 1.", requiredComponent: 'Wire', targetPos: [-1.75, 0.22, 0.375], wireEndPos: [1.625, 0.22, 0.375], guideKey: 'guide.motor.step4' },
        { id: 'wire-3', instruction: "Step 7: Connect Motor Pin 2 to Battery (- Black).", requiredComponent: 'Wire', targetPos: [2.375, 0.22, 0.375], wireEndPos: [-6.75, 0.22, 2.625], guideKey: 'guide.motor.step3' },
    ],
    'series-resistor': [
        { id: 'place-breadboard', instruction: "Step 1: Place the Breadboard.", requiredComponent: 'Breadboard', targetPos: [0, 0, 0], guideKey: 'guide.step0' },
        { id: 'place-battery', instruction: "Step 2: Place the Battery.", requiredComponent: 'Battery', targetPos: [-6, 0.25, 2.625], guideKey: 'guide.step1' },
        { id: 'place-res1', instruction: "Step 3: Place the first Resistor (R1).", requiredComponent: 'Resistor', targetPos: [-2, 0.25, 0.375], guideKey: 'guide.series.step1' },
        { id: 'place-res2', instruction: "Step 4: Place the second Resistor (R2).", requiredComponent: 'Resistor', targetPos: [0, 0.25, 0.375], guideKey: 'guide.series.step2' },
        { id: 'place-led', instruction: "Step 5: Place the LED.", requiredComponent: 'LED', targetPos: [2.125, 0.25, 0.375], guideKey: 'guide.step4' },
        { id: 'place-breadboard', instruction: "Step 1: Place the Breadboard.", requiredComponent: 'Breadboard', targetPos: [0, 0, 0], guideKey: 'guide.step0' },
        { id: 'place-battery', instruction: "Step 2: Place the Battery.", requiredComponent: 'Battery', targetPos: [-6, 0.25, 2.625], guideKey: 'guide.step1' },
        { id: 'place-res1', instruction: "Step 3: Place the first Resistor (R1).", requiredComponent: 'Resistor', targetPos: [-2, 0.25, 0.375], guideKey: 'guide.series.step1' },
        { id: 'place-res2', instruction: "Step 4: Place the second Resistor (R2).", requiredComponent: 'Resistor', targetPos: [0, 0.25, 0.375], guideKey: 'guide.series.step2' },
        { id: 'place-led', instruction: "Step 5: Place the LED.", requiredComponent: 'LED', targetPos: [2.125, 0.25, 0.375], guideKey: 'guide.step4' },
        { id: 'place-breadboard-redundant', instruction: "Step 1: Place the Breadboard.", requiredComponent: 'Breadboard', targetPos: [0, 0, 0], guideKey: 'guide.step0' },
        { id: 'place-battery-redundant', instruction: "Step 2: Place the Battery.", requiredComponent: 'Battery', targetPos: [-6, 0.25, 2.625], guideKey: 'guide.step1' },
        { id: 'place-res1-redundant', instruction: "Step 3: Place the first Resistor (R1).", requiredComponent: 'Resistor', targetPos: [-2, 0.25, 0.375], guideKey: 'guide.series.step1' },
        { id: 'place-res2-redundant', instruction: "Step 4: Place the second Resistor (R2).", requiredComponent: 'Resistor', targetPos: [0, 0.25, 0.375], guideKey: 'guide.series.step2' },
        { id: 'place-led-redundant', instruction: "Step 5: Place the LED.", requiredComponent: 'LED', targetPos: [2.125, 0.25, 0.375], guideKey: 'guide.step4' },
        { id: 'wire-1', instruction: "Step 6: Connect Battery (+) to R1.", requiredComponent: 'Wire', targetPos: [-5.25, 0.22, 2.125], wireEndPos: [-2.5, 0.22, 0.375], guideKey: 'guide.step5' },
        { id: 'wire-2', instruction: "Step 7: Connect R1 to R2.", requiredComponent: 'Wire', targetPos: [-1.5, 0.22, 0.375], wireEndPos: [-0.5, 0.22, 0.375], guideKey: 'guide.series.step3' },
        { id: 'wire-3', instruction: "Step 8: Connect R2 to LED Anode (+).", requiredComponent: 'Wire', targetPos: [0.5, 0.22, 0.375], wireEndPos: [2.25, 0.22, 0.375], guideKey: 'guide.step7' },
        { id: 'wire-4', instruction: "Step 9: Connect LED Cathode (-) to Battery (-).", requiredComponent: 'Wire', targetPos: [2, 0.22, 0.375], wireEndPos: [-6.75, 0.22, 2.625], guideKey: 'guide.step8' },
    ],
    'buzzer-alarm': [
        { id: 'bb', instruction: "Place Breadboard", requiredComponent: 'Breadboard', targetPos: BB_POS, guideKey: 'guide.step0' },
        { id: 'batt', instruction: "Place Battery", requiredComponent: 'Battery', targetPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2]], guideKey: 'guide.step1' },
        { id: 'sw', instruction: "Place Switch", requiredComponent: 'Switch', targetPos: [BB_POS[0], 0.25, BB_POS[2]], guideKey: 'guide.step2' },
        { id: 'buzz', instruction: "Place Buzzer", requiredComponent: 'Buzzer', targetPos: [BB_POS[0] + 1.0, 0.25, BB_POS[2]], guideKey: 'guide.buzzer.step1' },
        { id: 'w1', instruction: "Wire VCC", requiredComponent: 'Wire', targetPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2] - 2.125], wireEndPos: [BB_POS[0] - 0.25, 0.25, BB_POS[2] - 0.375], guideKey: 'guide.step5' },
        { id: 'w2', instruction: "Wire Switch to Buzzer", requiredComponent: 'Wire', targetPos: [BB_POS[0] + 0.25, 0.25, BB_POS[2] - 0.375], wireEndPos: [BB_POS[0] + 1.25, 0.25, BB_POS[2] - 0.125], guideKey: 'guide.buzzer.step2' },
        { id: 'w3', instruction: "Wire GND", requiredComponent: 'Wire', targetPos: [BB_POS[0] + 0.75, 0.25, BB_POS[2] + 0.125], wireEndPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2] + 2.625], guideKey: 'guide.buzzer.step3' },
    ],
    'pot-led': [
        { id: 'bb', instruction: "Place Breadboard", requiredComponent: 'Breadboard', targetPos: BB_POS, guideKey: 'guide.step0' },
        { id: 'batt', instruction: "Place Battery", requiredComponent: 'Battery', targetPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2]], guideKey: 'guide.step1' },
        { id: 'pot', instruction: "Place Potentiometer", requiredComponent: 'Potentiometer', targetPos: [BB_POS[0], 0.25, BB_POS[2]], guideKey: 'guide.pot.step1' },
        { id: 'led', instruction: "Place LED", requiredComponent: 'LED', targetPos: [BB_POS[0] + 1.25, 0.25, BB_POS[2]], guideKey: 'guide.step4' },
        { id: 'w1', instruction: "Wire VCC", requiredComponent: 'Wire', targetPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2] - 2.125], wireEndPos: [BB_POS[0] - 0.25, 0.25, BB_POS[2] - 0.375], guideKey: 'guide.step5' },
        { id: 'w2', instruction: "Wire Wiper to LED", requiredComponent: 'Wire', targetPos: [BB_POS[0] + 0.0, 0.25, BB_POS[2] + 0.125], wireEndPos: [BB_POS[0] + 1.25, 0.25, BB_POS[2] - 0.375], guideKey: 'guide.pot.step2' },
        { id: 'w3', instruction: "Wire GND", requiredComponent: 'Wire', targetPos: [BB_POS[0] + 1.375, 0.25, BB_POS[2] + 0.375], wireEndPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2] + 2.625], guideKey: 'guide.step8' },
    ],
    'parallel-led': [
        { id: 'bb', instruction: "Place Breadboard", requiredComponent: 'Breadboard', targetPos: BB_POS, guideKey: 'guide.step0' },
        { id: 'batt', instruction: "Place Battery", requiredComponent: 'Battery', targetPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2]], guideKey: 'guide.step1' },
        { id: 'res', instruction: "Place Resistor", requiredComponent: 'Resistor', targetPos: [BB_POS[0], 0.25, BB_POS[2]], guideKey: 'guide.step3' },
        { id: 'led1', instruction: "Place LED 1", requiredComponent: 'LED', targetPos: [BB_POS[0] + 1.0, 0.25, BB_POS[2] - 0.5], guideKey: 'guide.step4' },
        { id: 'led2', instruction: "Place LED 2", requiredComponent: 'LED', targetPos: [BB_POS[0] + 1.0, 0.25, BB_POS[2] + 0.5], guideKey: 'guide.parallel.step1' },
        { id: 'w1', instruction: "Wire VCC", requiredComponent: 'Wire', targetPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2] - 2.125], wireEndPos: [BB_POS[0] - 0.25, 0.25, BB_POS[2] - 0.375], guideKey: 'guide.step5' },
        { id: 'w2', instruction: "Wire LEDs in Parallel", requiredComponent: 'Wire', targetPos: [BB_POS[0] + 1.0, 0.25, BB_POS[2] - 0.125], wireEndPos: [BB_POS[0] - 0.25, 0.25, BB_POS[2] + 2.625], guideKey: 'guide.parallel.step2' },
    ],
    'pot-motor': [
        { id: 'bb', instruction: "Place Breadboard", requiredComponent: 'Breadboard', targetPos: BB_POS, guideKey: 'guide.step0' },
        { id: 'batt', instruction: "Place Battery", requiredComponent: 'Battery', targetPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2]], guideKey: 'guide.step1' },
        { id: 'pot', instruction: "Place Potentiometer", requiredComponent: 'Potentiometer', targetPos: [BB_POS[0], 0.25, BB_POS[2]], guideKey: 'guide.pot.step1' },
        { id: 'motor', instruction: "Place Motor", requiredComponent: 'Motor', targetPos: [BB_POS[0] + 1.25, 0.25, BB_POS[2]], guideKey: 'guide.pot-motor.step_motor' },
        { id: 'w1', instruction: "Wire VCC", requiredComponent: 'Wire', targetPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2] - 2.125], wireEndPos: [BB_POS[0] - 0.25, 0.25, BB_POS[2] - 0.375], guideKey: 'guide.step5' },
        { id: 'w2', instruction: "Wire Wiper to Motor", requiredComponent: 'Wire', targetPos: [BB_POS[0] + 0.0, 0.25, BB_POS[2] + 0.125], wireEndPos: [BB_POS[0] + 0.875, 0.25, BB_POS[2] - 0.125], guideKey: 'guide.pot-motor.step1' },
        { id: 'w3', instruction: "Wire GND", requiredComponent: 'Wire', targetPos: [BB_POS[0] + 1.625, 0.25, BB_POS[2] + 0.125], wireEndPos: [BB_POS[0] - 2.5, 0.25, BB_POS[2] + 2.625], guideKey: 'guide.pot-motor.step2' },
    ],
    'switch-motor': [
        { id: 'bb', instruction: "Place Breadboard", requiredComponent: 'Breadboard', targetPos: BB_POS, guideKey: 'guide.step0' },
        { id: 'batt', instruction: "Place Battery", requiredComponent: 'Battery', targetPos: [-6, 0.25, 2.625], guideKey: 'guide.step1' },
        { id: 'sw', instruction: "Place Switch", requiredComponent: 'Switch', targetPos: [-2, 0.25, 0.375], guideKey: 'guide.step2' },
        { id: 'motor', instruction: "Place Motor", requiredComponent: 'Motor', targetPos: [2, 0.25, 0.375], guideKey: 'guide.motor.step1' },
        { id: 'w1', instruction: "Wire VCC to Switch", requiredComponent: 'Wire', targetPos: [-5.25, 0.22, 2.125], wireEndPos: [-2.25, 0.22, 0.375], guideKey: 'guide.step5' },
        { id: 'w2', instruction: "Wire Switch to Motor", requiredComponent: 'Wire', targetPos: [-1.75, 0.22, 0.375], wireEndPos: [1.625, 0.22, 0.375], guideKey: 'guide.motor.step4' },
        { id: 'w3', instruction: "Wire Motor to GND", requiredComponent: 'Wire', targetPos: [2.375, 0.22, 0.375], wireEndPos: [-6.75, 0.22, 2.625], guideKey: 'guide.step8' },
    ],
    'series-circuit': [
        { id: 'bb', instruction: "Place Breadboard", requiredComponent: 'Breadboard', targetPos: BB_POS, guideKey: 'guide.step0' },
        { id: 'batt', instruction: "Place Battery", requiredComponent: 'Battery', targetPos: [-6, 0.25, 2.625], guideKey: 'guide.step1' },
        { id: 'led', instruction: "Place LED", requiredComponent: 'LED', targetPos: [-1, 0.25, 0.375], guideKey: 'guide.step4' },
        { id: 'buzzer', instruction: "Place Buzzer", requiredComponent: 'Buzzer', targetPos: [2, 0.25, 0.375], guideKey: 'guide.buzzer.step1' },
        { id: 'w1', instruction: "Wire VCC to LED", requiredComponent: 'Wire', targetPos: [-5.25, 0.22, 2.125], wireEndPos: [-0.875, 0.22, 0.375], guideKey: 'guide.step5' },
        { id: 'w2', instruction: "Wire LED to Buzzer", requiredComponent: 'Wire', targetPos: [-1.125, 0.22, 0.375], wireEndPos: [2.25, 0.22, 0.375], guideKey: 'guide.step6' },
        { id: 'w3', instruction: "Wire Buzzer to GND", requiredComponent: 'Wire', targetPos: [1.75, 0.22, 0.375], wireEndPos: [-6.75, 0.22, 2.625], guideKey: 'guide.step8' },
    ],
    'smart-doorbell': [
        { id: 'bb', instruction: "Place Breadboard", requiredComponent: 'Breadboard', targetPos: BB_POS, guideKey: 'guide.step0' },
        { id: 'batt', instruction: "Place Battery", requiredComponent: 'Battery', targetPos: [-6, 0.25, 2.625], guideKey: 'guide.step1' },
        { id: 'sw', instruction: "Place Switch", requiredComponent: 'Switch', targetPos: [-2, 0.25, 0.375], guideKey: 'guide.step2' },
        { id: 'led', instruction: "Place LED", requiredComponent: 'LED', targetPos: [1, 0.25, 1.375], guideKey: 'guide.step4' },
        { id: 'buzzer', instruction: "Place Buzzer", requiredComponent: 'Buzzer', targetPos: [1, 0.25, -1.375], guideKey: 'guide.buzzer.step1' },
        { id: 'w1', instruction: "Wire VCC to Switch", requiredComponent: 'Wire', targetPos: [-5.25, 0.22, 2.125], wireEndPos: [-2.25, 0.22, 0.375], guideKey: 'guide.step5' },
        { id: 'w2', instruction: "Wire Switch to LED", requiredComponent: 'Wire', targetPos: [-1.75, 0.22, 0.375], wireEndPos: [1.125, 0.22, 1.375], guideKey: 'guide.step6' },
        { id: 'w3', instruction: "Wire Switch to Buzzer", requiredComponent: 'Wire', targetPos: [-1.75, 0.22, 0.375], wireEndPos: [1.25, 0.22, -1.375], guideKey: 'guide.step6' },
        { id: 'w4', instruction: "Wire LED to GND", requiredComponent: 'Wire', targetPos: [0.875, 0.22, 1.375], wireEndPos: [-6.75, 0.22, 2.625], guideKey: 'guide.step8' },
        { id: 'w5', instruction: "Wire Buzzer to GND", requiredComponent: 'Wire', targetPos: [0.75, 0.22, -1.375], wireEndPos: [-6.75, 0.22, 2.625], guideKey: 'guide.step8' },
    ],
};

const EXPERIMENT_VIDEOS: Record<string, { title: string, url: string }> = {
    'led-battery': { title: 'LED Breadboard Circuit Tutorial', url: 'https://www.youtube.com/embed/UvS9Wf2BoyE' },
    'motor-battery': { title: 'How DC Motors Work', url: 'https://www.youtube.com/embed/LAtPHANEfQo' },
    'series-resistor': { title: 'Resistors in Series', url: 'https://www.youtube.com/embed/uH_Xy7m2G9w' },
    'buzzer-alarm': { title: 'How Piezo Buzzers Work', url: 'https://www.youtube.com/embed/7VpAsLREHMc' },
    'pot-led': { title: 'Potentiometer Basics', url: 'https://www.youtube.com/embed/MpsXp5B2i50' },
    'parallel-led': { title: 'LEDs in Parallel', url: 'https://www.youtube.com/embed/N-OqD-f0G-s' },
    'pot-motor': { title: 'Motor Speed Control', url: 'https://www.youtube.com/embed/3D0mD_H0m_c' },
    'switch-motor': { title: 'Switch Controlled Motor', url: 'https://www.youtube.com/embed/LAtPHANEfQo' },
    'series-circuit': { title: 'Series Mixed Components', url: 'https://www.youtube.com/embed/uH_Xy7m2G9w' },
    'smart-doorbell': { title: 'Smart Doorbell Architecture', url: 'https://www.youtube.com/embed/7VpAsLREHMc' },
};

const EXPERIMENT_DIAGRAMS: Record<string, string> = {
    'led-battery': '/images/diagrams/basic-circuit.png',
    'motor-battery': '/images/diagrams/motor-circuit.png',
    'series-resistor': '/images/diagrams/series-circuit.png',
    'buzzer-alarm': '/images/diagrams/buzzer-circuit.png',
    'pot-led': '/images/diagrams/pot-circuit.png',
    'parallel-led': '/images/diagrams/parallel-circuit.png',
    'pot-motor': '/images/diagrams/motor-circuit.png',
    'switch-motor': '/images/diagrams/motor-circuit.png',
    'series-circuit': '/images/diagrams/series-circuit.png',
    'smart-doorbell': '/images/diagrams/parallel-circuit.png',
};

// Helper to check distance
const dist3d = (p1: number[], p2: number[]) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[2] - p2[2], 2));

// Helper to check if user placed object near target
const isNear = (p1: number[], p2: number[], tol = 0.5) => dist3d(p1, p2) < tol;

// ============================================================
//  CONNECTION GUIDE UI
// ============================================================
const ConnectionGuide = () => {
    // We'll replace the static guide with a dynamic one in the main component
    return null;
};

// ============================================================
//  COMPONENT: Draggable (for components ON the breadboard)
// ============================================================
const Draggable = ({ children, position, onDrag, onSelect, enabled = true, draggable = true, isInteracting = false, lockY = 0.3 }: any) => {
    const [dragging, setDragging] = useState(false);

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (isInteracting) return;
        e.stopPropagation();
        onSelect?.();
        if (!draggable) return;
        (e.target as any)?.setPointerCapture?.(e.pointerId);
        setDragging(true);
    };

    const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
        if (!dragging) return;
        e.stopPropagation();
        (e.target as any)?.releasePointerCapture?.(e.pointerId);
        setDragging(false);
        // Snap to grid on release
        const snapped: [number, number, number] = [
            BB_POS[0] + SNAP(position[0] - BB_POS[0]),
            lockY,
            BB_POS[2] + SNAP(position[2] - BB_POS[2])
        ];
        onDrag(snapped);
    };

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!dragging || !enabled || isInteracting) return;
        onDrag([e.point.x, position[1], e.point.z]);
    };

    return (
        <group position={position} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerMove={handlePointerMove}>
            {children}
        </group>
    );
};

// ============================================================
//  3D MODELS — Matching real reference photos
// ============================================================

// --- 9V Battery (Hi-Watt style: rectangular, blue/white/red label, snap terminals) ---
// Battery wires connect from the snap terminals down to the pin positions (breadboard holes)
const RealisticBattery = ({ pos, onDrag, onSelect, isInteracting, selected, draggable = true }: any) => (
    <Draggable position={pos} onDrag={onDrag} onSelect={onSelect} lockY={0.5} isInteracting={isInteracting} draggable={draggable}>
        <group>
            {/* Main body - rectangular 9V shape */}
            <RoundedBox args={[1.2, 2.2, 0.7]} radius={0.05} position={[0, 1.1, 0]}>
                <meshStandardMaterial color="#2255aa" roughness={0.4} metalness={0.1} />
            </RoundedBox>
            {/* White top section */}
            <mesh position={[0, 2.1, 0]}>
                <boxGeometry args={[1.2, 0.2, 0.7]} />
                <meshStandardMaterial color="#e8e8e8" roughness={0.3} />
            </mesh>
            {/* Red stripe */}
            <mesh position={[0, 1.3, 0.351]}>
                <planeGeometry args={[1.18, 0.15]} />
                <meshStandardMaterial color="#cc2222" />
            </mesh>
            {/* Blue bottom label area */}
            <mesh position={[0, 0.6, 0.351]}>
                <planeGeometry args={[1.18, 0.8]} />
                <meshStandardMaterial color="#1a3d7a" />
            </mesh>
            {/* "9V" text */}
            <Text position={[0, 1.5, 0.36]} fontSize={0.25} color="white" fontWeight="900">9V</Text>
            <Text position={[0, 0.65, 0.36]} fontSize={0.12} color="white">Hi-Watt</Text>

            {/* Snap terminals on top */}
            {/* Positive terminal (smaller, round) */}
            <mesh position={[0.25, 2.25, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.12, 32]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Negative terminal (larger, hexagonal-like) */}
            <mesh position={[-0.25, 2.25, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.1, 6]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Red wire (+) from positive terminal → pin VCC position [0.75, 0, -0.5] */}
            <BatteryWire
                startPos={[0.25, 2.25, 0]}
                endPos={[0.75, -0.3, -0.5]}
                color="#cc2222"
            />
            {/* Black wire (−) from negative terminal → pin GND position [-0.75, 0, 0.0] */}
            <BatteryWire
                startPos={[-0.25, 2.25, 0]}
                endPos={[-0.75, -0.3, 0.0]}
                color="#222222"
            />

            {/* Pin indicator dots when selected */}
            {selected && (
                <>
                    {/* VCC pin (+) */}
                    <mesh position={[0.75, -0.25, -0.5]}>
                        <sphereGeometry args={[0.06, 16, 16]} />
                        <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={2} />
                    </mesh>
                    <Text position={[0.75, 0.1, -0.5]} fontSize={0.1} color="#ff3333" anchorX="center" anchorY="middle">VCC+</Text>
                    {/* GND pin (−) */}
                    <mesh position={[-0.75, -0.25, 0.0]}>
                        <sphereGeometry args={[0.06, 16, 16]} />
                        <meshStandardMaterial color="#3366ff" emissive="#3366ff" emissiveIntensity={2} />
                    </mesh>
                    <Text position={[-0.75, 0.1, 0.0]} fontSize={0.1} color="#3366ff" anchorX="center" anchorY="middle">GND−</Text>
                </>
            )}
        </group>
    </Draggable>
);

// Helper: Realistic battery wire that curves from terminal down to a pin position on the breadboard
const BatteryWire = ({ startPos, endPos, color }: { startPos: [number, number, number], endPos: [number, number, number], color: string }) => {
    const curve = useMemo(() => {
        const s = new THREE.Vector3(...startPos);
        const e = new THREE.Vector3(...endPos);
        // Wire rises slightly from terminal, arcs outward, then drops vertically into the breadboard hole
        const midY = Math.max(s.y, e.y) + 0.3;
        return new THREE.CatmullRomCurve3([
            s,
            new THREE.Vector3(s.x, s.y + 0.15, s.z),                    // rise from terminal
            new THREE.Vector3(s.x + (e.x - s.x) * 0.3, midY, s.z + (e.z - s.z) * 0.3), // arc out
            new THREE.Vector3(e.x, midY * 0.6, e.z),                    // descend toward hole
            new THREE.Vector3(e.x, e.y + 0.15, e.z),                    // above hole
            e,                                                            // into the hole
        ]);
    }, [startPos, endPos]);
    return (
        <mesh>
            <tubeGeometry args={[curve, 48, 0.035, 8, false]} />
            <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
    );
};

// --- Red LED (5mm, dome top, two thin wire legs — anode longer) ---
// Legs go precisely into breadboard holes at PITCH/2 spacing
const RealisticLED = ({ pos, onDrag, color = '#ff0033', active, onSelect, isInteracting, selected, draggable = true }: any) => (
    <Draggable position={pos} onDrag={onDrag} onSelect={onSelect} lockY={0.25} isInteracting={isInteracting} draggable={draggable}>
        <group>
            {/* LED dome (top hemisphere) */}
            <mesh position={[0, 0.55, 0]}>
                <sphereGeometry args={[0.18, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshPhysicalMaterial
                    color={color}
                    transparent
                    opacity={0.7}
                    emissive={active ? color : '#000'}
                    emissiveIntensity={active ? 100 : 0}
                    toneMapped={false}
                    roughness={0.1}
                    clearcoat={1}
                    transmission={0.3}
                />
            </mesh>
            {/* LED body (cylinder) */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.18, 0.2, 0.3, 32]} />
                <meshPhysicalMaterial
                    color={color}
                    transparent
                    opacity={0.6}
                    emissive={active ? color : '#000'}
                    emissiveIntensity={active ? 150 : 0}
                    toneMapped={false}
                    roughness={0.1}
                    clearcoat={1}
                />
            </mesh>
            {/* Flat edge (cathode indicator) */}
            <mesh position={[-0.17, 0.4, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.04, 0.28, 0.12]} />
                <meshStandardMaterial color={active ? color : '#cc0033'} transparent opacity={0.4} />
            </mesh>
            {/* Rim at base */}
            <mesh position={[0, 0.24, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
                <meshStandardMaterial color="#aaa" metalness={0.3} />
            </mesh>

            {active && <pointLight color={color} intensity={40} distance={10} position={[0, 0.6, 0]} />}
            {active && <pointLight color={color} intensity={20} distance={4} position={[0, 0.3, 0]} />}

            {/* Anode leg (longer, right side) — goes into breadboard hole */}
            <mesh position={[PITCH / 2, -0.15, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.55]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Cathode leg (shorter, left side) — goes into breadboard hole */}
            <mesh position={[-PITCH / 2, -0.1, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.45]} />
                <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Pin indicator dots when selected */}
            {selected && (
                <>
                    <mesh position={[PITCH / 2, -0.42, 0]}>
                        <sphereGeometry args={[0.04, 12, 12]} />
                        <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={3} />
                    </mesh>
                    <Text position={[PITCH / 2, 0.75, 0]} fontSize={0.08} color="#ff3333" anchorX="center">A+</Text>
                    <mesh position={[-PITCH / 2, -0.32, 0]}>
                        <sphereGeometry args={[0.04, 12, 12]} />
                        <meshStandardMaterial color="#3366ff" emissive="#3366ff" emissiveIntensity={3} />
                    </mesh>
                    <Text position={[-PITCH / 2, 0.75, 0]} fontSize={0.08} color="#3366ff" anchorX="center">K−</Text>
                </>
            )}
        </group>
    </Draggable>
);

// --- Resistor (with color bands on tan body, long thin wire leads) ---
// Leads land precisely at pin positions [-0.575, 0, 0] and [0.575, 0, 0]
const RealisticResistor = ({ pos, onDrag, onSelect, isInteracting, selected, draggable = true }: any) => (
    <Draggable position={pos} onDrag={onDrag} onSelect={onSelect} lockY={0.25} isInteracting={isInteracting} draggable={draggable}>
        <group>
            {/* Body — tan/beige cylinder */}
            <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.45, 16]} />
                <meshStandardMaterial color="#d2b48c" roughness={0.7} />
            </mesh>
            {/* Color Bands: Red-Red-Brown-Gold = 220Ω */}
            {[
                { offset: -0.12, color: '#cc2222' },  // red
                { offset: -0.04, color: '#cc2222' },  // red
                { offset: 0.04, color: '#8b4513' },   // brown
                { offset: 0.14, color: '#c8a24e' },   // gold (tolerance)
            ].map((band, i) => (
                <mesh key={i} position={[band.offset, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.085, 0.085, 0.04, 16]} />
                    <meshStandardMaterial color={band.color} />
                </mesh>
            ))}

            {/* Left lead wire — bends down into breadboard hole at [-0.5, 0, 0] */}
            <group>
                {/* Horizontal section from body to bend point */}
                <mesh position={[-0.4, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.35]} />
                    <meshStandardMaterial color="#bbb" metalness={0.8} />
                </mesh>
                {/* Vertical section going into the breadboard hole */}
                <mesh position={[-0.5, 0.0, 0]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.7]} />
                    <meshStandardMaterial color="#bbb" metalness={0.8} />
                </mesh>
            </group>
            {/* Right lead wire — bends down into breadboard hole at [0.5, 0, 0] */}
            <group>
                <mesh position={[0.4, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.35]} />
                    <meshStandardMaterial color="#bbb" metalness={0.8} />
                </mesh>
                <mesh position={[0.5, 0.0, 0]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.7]} />
                    <meshStandardMaterial color="#bbb" metalness={0.8} />
                </mesh>
            </group>

            {/* Pin indicator dots when selected */}
            {selected && (
                <>
                    <mesh position={[-0.5, -0.35, 0]}>
                        <sphereGeometry args={[0.04, 12, 12]} />
                        <meshStandardMaterial color="#888" emissive="#aaa" emissiveIntensity={2} />
                    </mesh>
                    <Text position={[-0.5, 0.55, 0]} fontSize={0.08} color="#888" anchorX="center">P1</Text>
                    <mesh position={[0.5, -0.35, 0]}>
                        <sphereGeometry args={[0.04, 12, 12]} />
                        <meshStandardMaterial color="#888" emissive="#aaa" emissiveIntensity={2} />
                    </mesh>
                    <Text position={[0.5, 0.55, 0]} fontSize={0.08} color="#888" anchorX="center">P2</Text>
                </>
            )}
        </group>
    </Draggable>
);

// --- 2-Pin Toggle Switch (rectangular, 2 legs) ---
// Legs go into breadboard holes at [-0.25, 0, 0] and [0.25, 0, 0] (spanning 2 holes = 0.5 units)
// ============================================================
//  AUDIO ENGINE
// ============================================================
// Shared Audio Context - Singleton pattern for browser audio policy
let sharedAudioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const getAudioEngine = () => {
    if (typeof window !== 'undefined' && !sharedAudioCtx) {
        try {
            sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            masterGain = sharedAudioCtx.createGain();
            masterGain.gain.setValueAtTime(0.8, sharedAudioCtx.currentTime);
            masterGain.connect(sharedAudioCtx.destination);
        } catch (e) {
            console.error("AudioContext initialization failed", e);
        }
    }
    return { ctx: sharedAudioCtx, master: masterGain };
};

const resumeAudio = (onStateChange?: (state: string) => void) => {
    const { ctx } = getAudioEngine();
    if (ctx) {
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                if (onStateChange) onStateChange(ctx.state);
            });
        } else {
            if (onStateChange) onStateChange(ctx.state);
        }
    }
};

const RealisticSwitch = ({ pos, onDrag, isOpen, onToggle, onSelect, isInteracting, selected, draggable = true, onAudioResume }: any) => (
    <Draggable position={pos} onDrag={onDrag} onSelect={onSelect} lockY={0.25} isInteracting={isInteracting} draggable={draggable}>
        <group onPointerDown={(e) => {
            if (onAudioResume) onAudioResume(); // Ensure audio is resumed on interaction
            if (!isInteracting) { onToggle(); }
        }}>
            {/* Base */}
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[0.7, 0.25, 0.4]} />
                <meshStandardMaterial color="#333" roughness={0.5} />
            </mesh>
            {/* Toggle Lever */}
            <group position={[isOpen ? -0.15 : 0.15, 0.25, 0]} rotation={[0, 0, isOpen ? 0.3 : -0.3]}>
                <mesh position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
                    <meshStandardMaterial color="#eee" metalness={0.6} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.4, 0]}>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial color={isOpen ? "#cc3333" : "#22cc44"} />
                </mesh>
            </group>

            {/* 2 metal legs going into breadboard holes */}
            <mesh position={[-0.25, -0.15, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.55]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.9} />
            </mesh>
            <mesh position={[0.25, -0.15, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.55]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.9} />
            </mesh>

            {/* Pin indicator dots when selected */}
            {selected && (
                <>
                    <mesh position={[-0.25, -0.42, 0]}>
                        <sphereGeometry args={[0.035, 12, 12]} />
                        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
                    </mesh>
                    <mesh position={[0.25, -0.42, 0]}>
                        <sphereGeometry args={[0.035, 12, 12]} />
                        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
                    </mesh>
                </>
            )}
        </group>
    </Draggable>
);

// --- Realistic Motor Sound Hook ---
const useMotorSound = (active: boolean, intensity: number = 1.0) => {
    const fundamental = useRef<OscillatorNode | null>(null);
    const whir = useRef<OscillatorNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const filter = useRef<BiquadFilterNode | null>(null);
    const noiseTarget = useRef<OscillatorNode | null>(null);

    // Audio context and nodes management
    useEffect(() => {
        const { ctx, master } = getAudioEngine();
        if (!ctx || !master) return;

        if (active) {
            filter.current = ctx.createBiquadFilter();
            filter.current.type = 'lowpass';
            filter.current.frequency.setValueAtTime(800 + intensity * 400, ctx.currentTime);
            filter.current.connect(master);

            fundamental.current = ctx.createOscillator();
            fundamental.current.type = 'sine';
            fundamental.current.frequency.setValueAtTime(60 + intensity * 40, ctx.currentTime);

            whir.current = ctx.createOscillator();
            whir.current.type = 'sawtooth';
            whir.current.frequency.setValueAtTime(120 + intensity * 80, ctx.currentTime);

            gainNode.current = ctx.createGain();
            gainNode.current.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.current.gain.linearRampToValueAtTime(0.04 + intensity * 0.04, ctx.currentTime + 0.1);

            const noise = ctx.createOscillator();
            noise.type = 'sawtooth';
            noise.frequency.setValueAtTime(1000 + intensity * 500, ctx.currentTime);
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.003 * intensity, ctx.currentTime);
            noise.connect(noiseGain);
            noiseGain.connect(gainNode.current);
            noise.start();
            noiseTarget.current = noise;

            fundamental.current.connect(gainNode.current);
            whir.current.connect(gainNode.current);
            gainNode.current.connect(filter.current);

            fundamental.current.start();
            whir.current.start();

            return () => {
                const now = ctx.currentTime;
                gainNode.current?.gain.cancelScheduledValues(now);
                gainNode.current?.gain.linearRampToValueAtTime(0, now + 0.1);

                const f = fundamental.current;
                const w = whir.current;
                const n = noiseTarget.current;
                const g = gainNode.current;
                const fi = filter.current;

                setTimeout(() => {
                    f?.stop(); w?.stop(); n?.stop();
                    f?.disconnect(); w?.disconnect(); n?.disconnect();
                    g?.disconnect(); fi?.disconnect();
                }, 150);
            };
        } else {
            if (fundamental.current) {
                gainNode.current?.gain.cancelScheduledValues(ctx.currentTime);
                gainNode.current?.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

                const f = fundamental.current;
                const w = whir.current;
                const n = noiseTarget.current;
                const g = gainNode.current;
                const fi = filter.current;

                setTimeout(() => {
                    f?.stop(); w?.stop(); n?.stop();
                    f?.disconnect(); w?.disconnect(); n?.disconnect();
                    g?.disconnect(); fi?.disconnect();
                }, 150);
                fundamental.current = null;
            }
        }

        return () => {
            fundamental.current?.stop();
            whir.current?.stop();
            noiseTarget.current?.stop();
            fundamental.current?.disconnect();
            whir.current?.disconnect();
            noiseTarget.current?.disconnect();
            gainNode.current?.disconnect();
            filter.current?.disconnect();
        };
    }, [active, intensity]);
};

// --- DC Motor ---
const RealisticMotor = ({ pos, onDrag, active, intensity = 1.0, onSelect, isInteracting, selected, draggable = true }: any) => {
    useMotorSound(active, intensity);
    const shaftRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (active && shaftRef.current) {
            shaftRef.current.rotation.y += delta * (10 + intensity * 40);
        }
    });

    return (
        <Draggable position={pos} onDrag={onDrag} onSelect={onSelect} lockY={0.65} isInteracting={isInteracting} draggable={draggable}>
            <group>
                {/* Motor Body */}
                <mesh position={[0, 0.4, 0]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.8, 32]} />
                    <meshStandardMaterial color="#888" metalness={0.6} roughness={0.2} />
                </mesh>
                {/* Motor Top (Plastic) */}
                <mesh position={[0, 0.8, 0]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
                    <meshStandardMaterial color="#444" />
                </mesh>
                {/* Rotating Shaft with Fan */}
                <group ref={shaftRef} position={[0, 0.85, 0]}>
                    <mesh position={[0, 0.1, 0]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.3, 16]} />
                        <meshStandardMaterial color="#aaa" metalness={0.8} />
                    </mesh>
                    {/* 4-Blade Fan */}
                    {[0, 1, 2, 3].map((i) => (
                        <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
                            <mesh position={[0.2, 0.25, 0]} rotation={[0.4, 0, 0]}>
                                <RoundedBox args={[0.35, 0.02, 0.12]} radius={0.01}>
                                    <meshStandardMaterial color="#555" roughness={0.4} />
                                </RoundedBox>
                            </mesh>
                        </group>
                    ))}
                    {/* Fan Center Cap */}
                    <mesh position={[0, 0.25, 0]}>
                        <sphereGeometry args={[0.06, 16, 16]} />
                        <meshStandardMaterial color="#444" />
                    </mesh>
                </group>

                {/* Terminals */}
                <mesh position={[-0.375, -0.45, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.5]} />
                    <meshStandardMaterial color="#222" metalness={0.8} />
                </mesh>
                <mesh position={[0.375, -0.45, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.5]} />
                    <meshStandardMaterial color="#222" metalness={0.8} />
                </mesh>

                {selected && (
                    <>
                        <Text position={[-0.375, 1.2, 0]} fontSize={0.1} color="white">P1</Text>
                        <Text position={[0.375, 1.2, 0]} fontSize={0.1} color="white">P2</Text>
                    </>
                )}
            </group>
        </Draggable>
    );
};

// --- Buzzer ---
// --- Realistic Buzzer Sound Hook ---
const useBuzzerSound = (active: boolean, intensity: number = 1.0) => {
    const oscillator = useRef<OscillatorNode | null>(null);
    const harmonic = useRef<OscillatorNode | null>(null);
    const filter = useRef<BiquadFilterNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const lfo = useRef<OscillatorNode | null>(null);
    const lfoGain = useRef<GainNode | null>(null);

    useEffect(() => {
        const { ctx, master } = getAudioEngine();
        if (!ctx || !master) return;

        if (active) {
            // Band-pass filter to focus on realistic buzzer frequency range (~2.3kHz)
            filter.current = ctx.createBiquadFilter();
            filter.current.type = 'bandpass';
            filter.current.frequency.setValueAtTime(2300 + intensity * 500, ctx.currentTime);
            filter.current.Q.setValueAtTime(3, ctx.currentTime);
            filter.current.connect(master);

            // Main buzzer tone (Square wave for that harsh hardware buzz)
            oscillator.current = ctx.createOscillator();
            oscillator.current.type = 'square';
            oscillator.current.frequency.setValueAtTime(2300 + intensity * 500, ctx.currentTime);

            // High-frequency harmonic with slight offset for "grit"
            harmonic.current = ctx.createOscillator();
            harmonic.current.type = 'sawtooth';
            harmonic.current.frequency.setValueAtTime(2305 + intensity * 500, ctx.currentTime);

            gainNode.current = ctx.createGain();
            gainNode.current.gain.setValueAtTime(0, ctx.currentTime);
            // Snappy attack, volume influenced by intensity
            gainNode.current.gain.exponentialRampToValueAtTime(0.04 + intensity * 0.04, ctx.currentTime + 0.01);

            // Jitter LFO to simulate unstable mechanical/electronic vibration
            lfo.current = ctx.createOscillator();
            lfo.current.type = 'sine';
            lfo.current.frequency.setValueAtTime(45, ctx.currentTime);

            lfoGain.current = ctx.createGain();
            lfoGain.current.gain.setValueAtTime(15, ctx.currentTime); // Frequency modulation depth

            lfo.current.connect(lfoGain.current);
            lfoGain.current.connect(oscillator.current.frequency);
            lfoGain.current.connect(harmonic.current.frequency);

            // Add grittiness with a bit of noise
            const bufferSize = ctx.sampleRate * 1; // 1 second of noise
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = buffer;
            noiseSource.loop = true;
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.003, ctx.currentTime);
            noiseSource.connect(noiseGain);
            noiseGain.connect(gainNode.current);
            noiseSource.start();

            oscillator.current.connect(gainNode.current);
            harmonic.current.connect(gainNode.current);
            gainNode.current.connect(filter.current);

            oscillator.current.start();
            harmonic.current.start();
            lfo.current.start();

            return () => {
                const now = ctx.currentTime;
                gainNode.current?.gain.cancelScheduledValues(now);
                gainNode.current?.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

                const os = oscillator.current;
                const h = harmonic.current;
                const l = lfo.current;
                const g = gainNode.current;
                const lg = lfoGain.current;
                const fi = filter.current;

                setTimeout(() => {
                    os?.stop();
                    h?.stop();
                    l?.stop();
                    noiseSource?.stop();
                    os?.disconnect();
                    h?.disconnect();
                    l?.disconnect();
                    g?.disconnect();
                    lg?.disconnect();
                    fi?.disconnect();
                    noiseGain?.disconnect();
                }, 50);
                oscillator.current = null;
            };
        } else {
            if (oscillator.current) {
                gainNode.current?.gain.cancelScheduledValues(ctx.currentTime);
                gainNode.current?.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

                const os = oscillator.current;
                const h = harmonic.current;
                const l = lfo.current;
                const g = gainNode.current;
                const lg = lfoGain.current;
                const fi = filter.current;

                setTimeout(() => {
                    os?.stop();
                    h?.stop();
                    l?.stop();
                    os?.disconnect();
                    h?.disconnect();
                    l?.disconnect();
                    g?.disconnect();
                    lg?.disconnect();
                    fi?.disconnect();
                }, 50);
                oscillator.current = null;
            }
        }

        return () => {
            oscillator.current?.stop();
            harmonic.current?.stop();
            lfo.current?.stop();
            oscillator.current?.disconnect();
            harmonic.current?.disconnect();
            lfo.current?.disconnect();
            gainNode.current?.disconnect();
            lfoGain.current?.disconnect();
            filter.current?.disconnect();
        };
    }, [active, intensity]);
};

const RealisticBuzzer = ({ pos, onDrag, active, intensity = 1.0, onSelect, isInteracting, selected, draggable = true }: any) => {
    useBuzzerSound(active, intensity);
    return (
        <Draggable position={pos} onDrag={onDrag} onSelect={onSelect} lockY={0.405} isInteracting={isInteracting} draggable={draggable}>
            <group>
                <mesh position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
                    <meshStandardMaterial color="#111" roughness={0.8} />
                </mesh>
                <group position={[0, 0.4, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.3, 32]} />
                        <meshStandardMaterial color="#000" />
                    </mesh>
                </group>
                <Text position={[0.2, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.1} color="white">+</Text>
                <mesh position={[-0.25, -0.205, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.6]} />
                    <meshStandardMaterial color="#bbb" metalness={0.8} />
                </mesh>
                <mesh position={[0.25, -0.205, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.6]} />
                    <meshStandardMaterial color="#bbb" metalness={0.8} />
                </mesh>
                {active && (
                    <mesh position={[0, 0.5, 0]}>
                        <ringGeometry args={[0.1, 0.15, 32]} />
                        <meshBasicMaterial color="#ffff00" transparent opacity={0.6} />
                    </mesh>
                )}
            </group>
        </Draggable>
    );
};

// --- Potentiometer (3-pin, rotary knob) ---
const RealisticPotentiometer = ({ pos, onDrag, onSelect, isInteracting, selected, draggable = true, value, onValueChange }: any) => {
    const knobRef = useRef<THREE.Group>(null);
    const [isRotating, setIsRotating] = useState(false);
    const { viewport } = useThree();

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (isInteracting) return;
        e.stopPropagation();
        onSelect?.();
        if (!draggable) return;
        (e.target as any)?.setPointerCapture?.(e.pointerId);
        setIsRotating(true);
    };

    const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
        if (!isRotating) return;
        e.stopPropagation();
        (e.target as any)?.releasePointerCapture?.(e.pointerId);
        setIsRotating(false);
    };

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!isRotating || !onValueChange) return;
        // Calculate rotation based on mouse X movement
        const sensitivity = 0.005;
        const deltaX = e.movementX / viewport.width;
        let newValue = value + deltaX * sensitivity;
        newValue = Math.max(0, Math.min(1, newValue)); // Clamp between 0 and 1
        onValueChange(newValue);
    };

    useEffect(() => {
        if (knobRef.current) {
            // Map value (0-1) to rotation (e.g., -PI/2 to PI/2)
            knobRef.current.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.75, Math.PI * 0.75, value);
        }
    }, [value]);

    return (
        <Draggable position={pos} onDrag={onDrag} onSelect={onSelect} lockY={0.35} isInteracting={isInteracting} draggable={draggable}>
            <group>
                {/* Base */}
                <mesh position={[0, 0.15, 0]}>
                    <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
                    <meshStandardMaterial color="#333" roughness={0.6} />
                </mesh>
                {/* Shaft */}
                <mesh position={[0, 0.25, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
                    <meshStandardMaterial color="#aaa" metalness={0.8} />
                </mesh>
                {/* Knob */}
                <group ref={knobRef} position={[0, 0.3, 0]}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerMove={handlePointerMove}
                >
                    <mesh position={[0, 0.05, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
                        <meshStandardMaterial color="#555" roughness={0.4} />
                    </mesh>
                    {/* Indicator line */}
                    <mesh position={[0, 0.05, 0.15]}>
                        <boxGeometry args={[0.02, 0.02, 0.1]} />
                        <meshStandardMaterial color="#cc0000" />
                    </mesh>
                </group>

                {/* 3 pins */}
                <mesh position={[-PITCH, -0.15, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.55]} />
                    <meshStandardMaterial color="#c0c0c0" metalness={0.9} />
                </mesh>
                <mesh position={[0, -0.15, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.55]} />
                    <meshStandardMaterial color="#c0c0c0" metalness={0.9} />
                </mesh>
                <mesh position={[PITCH, -0.15, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.55]} />
                    <meshStandardMaterial color="#c0c0c0" metalness={0.9} />
                </mesh>

                {selected && (
                    <>
                        <mesh position={[-PITCH, -0.42, 0]}>
                            <sphereGeometry args={[0.035, 12, 12]} />
                            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
                        </mesh>
                        <Text position={[-PITCH, 0.55, 0]} fontSize={0.08} color="#ffaa00" anchorX="center">P1</Text>
                        <mesh position={[0, -0.42, 0]}>
                            <sphereGeometry args={[0.035, 12, 12]} />
                            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
                        </mesh>
                        <Text position={[0, 0.55, 0]} fontSize={0.08} color="#ffaa00" anchorX="center">Wiper</Text>
                        <mesh position={[PITCH, -0.42, 0]}>
                            <sphereGeometry args={[0.035, 12, 12]} />
                            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
                        </mesh>
                        <Text position={[PITCH, 0.55, 0]} fontSize={0.08} color="#ffaa00" anchorX="center">P3</Text>
                    </>
                )}
            </group>
        </Draggable>
    );
};

// ============================================================
//  BREADBOARD — Fixed at origin, not draggable
// ============================================================
const Breadboard = ({ isInteracting, onSceneClick }: { isInteracting: boolean, onSceneClick: (e: ThreeEvent<PointerEvent>) => void }) => {
    const holeGeom = useMemo(() => new THREE.BoxGeometry(0.1, 0.02, 0.1), []);
    const holeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1a' }), []);

    const holes = useMemo(() => {
        const list: [number, number][] = [];
        for (let c = -31; c <= 31; c++) {
            const x = c * PITCH;
            for (let r = 0; r < 5; r++) list.push([x, -1.125 + r * PITCH]);
            for (let r = 0; r < 5; r++) list.push([x, 0.125 + r * PITCH]);
            list.push([x, -2.625]);
            list.push([x, -2.125]);
            list.push([x, 2.125]);
            list.push([x, 2.625]);
        }
        return list;
    }, []);

    return (
        <group position={BB_POS} onPointerDown={(e) => isInteracting && (e.stopPropagation(), onSceneClick(e))}>
            {/* Main board */}
            <RoundedBox args={[16.5, 0.4, 6.2]} radius={0.08}>
                <meshStandardMaterial color="#f5f5f0" roughness={0.35} />
            </RoundedBox>

            {/* Center channel groove */}
            <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[15.75, 0.3]} />
                <meshStandardMaterial color="#e8e5d8" />
            </mesh>

            {/* Power rail markings */}
            <group position={[0, 0.205, 0]}>
                {/* Top rails */}
                <mesh position={[0, 0, -2.375]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[15.75, 0.03]} /><meshStandardMaterial color="#cc0000" /></mesh>
                <mesh position={[0, 0, -2.875]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[15.75, 0.03]} /><meshStandardMaterial color="#0044cc" /></mesh>
                {/* Bottom rails */}
                <mesh position={[0, 0, 2.375]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[15.75, 0.03]} /><meshStandardMaterial color="#cc0000" /></mesh>
                <mesh position={[0, 0, 2.875]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[15.75, 0.03]} /><meshStandardMaterial color="#0044cc" /></mesh>

                {/* + and - symbols */}
                {[-7.5, 0, 7.5].map(x => (
                    <React.Fragment key={x}>
                        <Text position={[x, 0.01, -2.375]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#cc0000">+</Text>
                        <Text position={[x, 0.01, -2.875]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#0044cc">−</Text>
                        <Text position={[x, 0.01, 2.375]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#cc0000">+</Text>
                        <Text position={[x, 0.01, 2.875]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#0044cc">−</Text>
                    </React.Fragment>
                ))}
            </group>

            {/* Column numbers (every 5) */}
            {[1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 63].map(num => (
                <Text key={num} position={[(num - 32) * PITCH, 0.21, -1.55]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.1} color="#999">{num}</Text>
            ))}
            {/* Row letters */}
            {['a', 'b', 'c', 'd', 'e'].map((letter, i) => (
                <Text key={letter} position={[-8.1, 0.21, -1.125 + i * PITCH]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.1} color="#999">{letter}</Text>
            ))}
            {['f', 'g', 'h', 'i', 'j'].map((letter, i) => (
                <Text key={letter} position={[-8.1, 0.21, 0.125 + i * PITCH]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.1} color="#999">{letter}</Text>
            ))}

            {/* Holes */}
            {holes.map((h, i) => (
                <mesh key={i} position={[h[0], 0.205, h[1]]} geometry={holeGeom} material={holeMat} />
            ))}

            {/* Brand text */}
            <Text position={[4, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.18} color="#ccc" fillOpacity={0.4}>AR Electronics Lab</Text>
        </group>
    );
};

// ============================================================
//  WIRE — Realistic jumper wire that snaps endpoints to holes
// ============================================================
const JumperWire = ({ start, end, color = "#ee3322" }: { start: [number, number, number], end: [number, number, number], color?: string }) => {
    const curve = useMemo(() => {
        const s = new THREE.Vector3(...start);
        const e = new THREE.Vector3(...end);
        const dist = s.distanceTo(e);
        const arcH = Math.min(dist * 0.4, 1.2) + 0.15;

        // Realistic jumper: rises vertically from hole, arcs, descends into hole
        const riseY = 0.3;
        return new THREE.CatmullRomCurve3([
            s,                                                                           // in the hole
            new THREE.Vector3(s.x, s.y + riseY, s.z),                                    // rise out
            new THREE.Vector3(s.x, s.y + riseY + arcH * 0.3, s.z),                       // bend up
            new THREE.Vector3((s.x + e.x) / 2, Math.max(s.y, e.y) + riseY + arcH, (s.z + e.z) / 2), // apex
            new THREE.Vector3(e.x, e.y + riseY + arcH * 0.3, e.z),                       // bend down
            new THREE.Vector3(e.x, e.y + riseY, e.z),                                    // above hole
            e,                                                                            // in the hole
        ]);
    }, [start, end]);

    return (
        <mesh>
            <tubeGeometry args={[curve, 64, 0.03, 8, false]} />
            <meshStandardMaterial color={color} roughness={0.5} metalness={0.05} />
        </mesh>
    );
};

// ============================================================
//  CAMERA JOYSTICK CONTROLLER (runs inside Canvas)
// ============================================================
const CameraController = ({ orbitRef, joystickRef }: { orbitRef: React.RefObject<any>; joystickRef: React.RefObject<[number, number]> }) => {
    useFrame(() => {
        const controls = orbitRef.current;
        const delta = joystickRef.current;
        if (!controls || !delta) return;
        const [dx, dy] = delta;
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return;
        // Rotate azimuthal (horizontal) and polar (vertical)
        const speed = 0.03;
        controls.setAzimuthalAngle(controls.getAzimuthalAngle() - dx * speed);
        const newPolar = controls.getPolarAngle() + dy * speed;
        controls.setPolarAngle(Math.max(0.2, Math.min(Math.PI / 2.1, newPolar)));
        controls.update();
    });
    return null;
};

// ============================================================
//  MAIN LAB
// ============================================================

const SIDEBAR_ITEMS = [
    { type: 'Breadboard', labelKey: 'comp.breadboard', icon: '📋', descKey: 'comp.breadboard.desc' },
    { type: 'Battery', labelKey: 'comp.battery', icon: '🔋', descKey: 'comp.battery.desc' },
    { type: 'LED', labelKey: 'comp.led', icon: '💡', descKey: 'comp.led.desc' },
    { type: 'Switch', labelKey: 'comp.switch', icon: '🔘', descKey: 'comp.switch.desc' },
    { type: 'Resistor', labelKey: 'comp.resistor', icon: '〰️', descKey: 'comp.resistor.desc' },
    { type: 'Motor', labelKey: 'comp.motor', icon: '⚙️', descKey: 'comp.motor.desc' },
    { type: 'Buzzer', labelKey: 'comp.buzzer', icon: '🔔', descKey: 'comp.buzzer.desc' },
    { type: 'Potentiometer', labelKey: 'comp.potentiometer', icon: '💠', descKey: 'comp.potentiometer.desc' },
    { type: 'Wire', labelKey: 'comp.wire', icon: '🔗', descKey: 'comp.wire.desc' },
];

const LED_COLORS = [
    { name: 'Red', hex: '#ff0033' },
    { name: 'Green', hex: '#00cc44' },
    { name: 'Blue', hex: '#0066ff' },
    { name: 'Yellow', hex: '#ffcc00' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Orange', hex: '#ff6600' },
];

const GUIDE_STEP_KEYS = [
    'guide.step0', 'guide.step1', 'guide.step2', 'guide.step3', 'guide.step4',
    'guide.step5', 'guide.step6', 'guide.step7', 'guide.step8',
];

const LANG_OPTIONS: { code: Language; label: string }[] = [
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

const WIRE_COLORS = [
    { name: 'Red', hex: '#ee3322' },
    { name: 'Black', hex: '#222222' },
    { name: 'Blue', hex: '#2255ff' },
    { name: 'Yellow', hex: '#ffcc00' },
    { name: 'Green', hex: '#22bb44' },
    { name: 'White', hex: '#eeeeee' },
    { name: 'Orange', hex: '#ff8800' },
];

export default function ElectronicsLab({ onBack, experimentId = 'led-battery' }: { onBack?: () => void, experimentId?: string }) {
    const { t, language, setLanguage } = useLanguage();
    const GUIDE_STEPS = GUIDE_DATA[experimentId] || GUIDE_DATA['led-battery'];
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showKYC, setShowKYC] = useState(false);
    const [components, setComponents] = useState<ComponentData[]>([]);
    const [ledColor, setLedColor] = useState('#ff0033');
    const [wires, setWires] = useState<WireData[]>([]);
    const [circuitState, setCircuitState] = useState<CircuitState>({ isComplete: false, current: 0, components: {} });

    const [wiringMode, setWiringMode] = useState(false);
    const [wireColor, setWireColor] = useState('#ee3322');
    const [wireStart, setWireStart] = useState<[number, number, number] | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [ghostType, setGhostType] = useState<string | null>(null);
    const [ghostPos, setGhostPos] = useState<[number, number, number]>([0, 1, 0]);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showDiagramModal, setShowDiagramModal] = useState(false);

    // Guide State
    const [guideStepIndex, setGuideStepIndex] = useState(0);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [guideComplete, setGuideComplete] = useState(false);

    // Audio State
    const [audioStatus, setAudioStatus] = useState<'suspended' | 'running'>('suspended');

    const handleResumeAudio = () => {
        resumeAudio((state) => setAudioStatus(state as 'suspended' | 'running'));
    };

    // Initial load: Set ghost type to the first step's requirement
    useEffect(() => {
        if (!guideComplete && GUIDE_STEPS[guideStepIndex]) {
            // Optional: Auto-select not needed, we just show the guide
        }
    }, [guideStepIndex, guideComplete]);

    // Check for step completion
    useEffect(() => {
        if (guideComplete) return;
        const currentStep = GUIDE_STEPS[guideStepIndex];
        if (!currentStep) return;

        // Check if a component exists near target
        if (currentStep.requiredComponent === 'Wire') {
            // Check if any wire connects the two target points
            const foundWire = wires.find(w =>
                (isNear(w.start, currentStep.targetPos, 0.4) && isNear(w.end, currentStep.wireEndPos!, 0.4)) ||
                (isNear(w.end, currentStep.targetPos, 0.4) && isNear(w.start, currentStep.wireEndPos!, 0.4))
            );
            if (foundWire) {
                if (guideStepIndex < GUIDE_STEPS.length - 1) {
                    setGuideStepIndex(prev => prev + 1);
                } else {
                    setGuideComplete(true);
                }
            }

        } else {
            // Check component
            // If checking for Breadboard, simpler check: does it exist?
            if (currentStep.requiredComponent === 'Breadboard') {
                const found = components.some(c => c.type === 'Breadboard');
                if (found) {
                    if (guideStepIndex < GUIDE_STEPS.length - 1) {
                        setGuideStepIndex(prev => prev + 1);
                    } else {
                        setGuideComplete(true);
                    }
                }
                return;
            }

            const found = components.find(c =>
                c.type === currentStep.requiredComponent &&
                isNear(c.state.pos, currentStep.targetPos, 0.5)
            );

            if (found) {
                // Play success sound logic here if needed
                if (guideStepIndex < GUIDE_STEPS.length - 1) {
                    setGuideStepIndex(prev => prev + 1);
                } else {
                    setGuideComplete(true);
                }
            }
        }
    }, [components, wires, guideStepIndex, guideComplete]);

    // Camera control refs
    const orbitRef = useRef<any>(null);
    const joystickDelta = useRef<[number, number]>([0, 0]);

    // Tutorial state (Removed, simple guide used instead)
    // const [tutorialStep, setTutorialStep] = useState(0);
    // const [showTutorial, setShowTutorial] = useState(true);

    useEffect(() => {
        const res = solveCircuit(components, wires);
        setCircuitState(res);
    }, [components, wires]);

    const getSnappedPos = useCallback((point: THREE.Vector3, type?: string): [number, number, number] => {
        // Magnetic Snap to Guide Target
        if (type && !guideComplete) {
            const step = GUIDE_STEPS[guideStepIndex];
            if (step && step.requiredComponent === type) {
                const target = step.targetPos;
                const dist = Math.sqrt(Math.pow(point.x - target[0], 2) + Math.pow(point.z - target[2], 2));
                if (dist < 1.5) { // Magnetic snap radius (generous)
                    return target as [number, number, number];
                }
            }
        }

        // --- Grid Snapping ---
        // X-axis: Pins land on 0.25 intervals (Columns)
        let x = BB_POS[0] + SNAP(point.x - BB_POS[0]);

        // Z-axis: Holes are offset by 0.125 from pitch lines
        // Correct snap: round to (n * 0.25 + 0.125)
        const rawZ = point.z - BB_POS[2];
        const nZ = Math.round((rawZ - 0.125) / PITCH);
        let z = BB_POS[2] + (nZ * PITCH + 0.125);

        // Special handling for Power Rails which are at +/- 2.125 and +/- 2.625
        // (These already follow the (n + 0.5) * PITCH rule)

        return [x, 0.25, z];
    }, [guideStepIndex, guideComplete]);
    // --- Voice Feedback for Guide ---
    useEffect(() => {
        if (!isVoiceActive || guideComplete || !GUIDE_STEPS[guideStepIndex]) return;

        const step = GUIDE_STEPS[guideStepIndex];
        const instruction = step.guideKey ? t(step.guideKey) : step.instruction;

        // Slight delay to allow UI to update or user to settle
        const timer = setTimeout(() => {
            voiceSystem.speak(instruction, language);
        }, 500);

        return () => clearTimeout(timer);
    }, [guideStepIndex, guideComplete, isVoiceActive, language, t]);

    // --- Voice Commands Setup ---
    useEffect(() => {
        if (isVoiceActive) {
            voiceSystem.startListening(language, (cmd) => {
                switch (cmd) {
                    case 'delete':
                        if (selectedId) setComponents(prev => prev.filter(c => c.id !== selectedId));
                        break;
                    case 'reset':
                        // Handle reset through a custom function or existing logic
                        // For now we can trigger the reset button logic if accessible
                        break;
                    case 'kyc':
                        setShowKYC(true);
                        break;
                    case 'settings':
                        setShowLangMenu(true);
                        break;
                    case 'led': setGhostType('LED'); break;
                    case 'battery': setGhostType('Battery'); break;
                    case 'resistor': setGhostType('Resistor'); break;
                    case 'switch': setGhostType('Switch'); break;
                    case 'motor': setGhostType('Motor'); break;
                    case 'buzzer': setGhostType('Buzzer'); break;
                }
            });
        } else {
            voiceSystem.stopListening();
        }
        return () => voiceSystem.stopListening();
    }, [isVoiceActive, language, selectedId]);

    // Get pin offsets for a given component type (used for ghost hole highlights)
    const getGhostPinOffsets = useCallback((type: string | null): [number, number][] => {
        if (!type) return [];
        if (type === 'LED') return [[PITCH / 2, 0], [-PITCH / 2, 0]];
        if (type === 'Resistor') return [[0.5, 0], [-0.5, 0]]; // Adjusted to 0.5
        if (type === 'Switch') return [[-0.25, 0], [0.25, 0]]; // Adjusted to 2 pins
        if (type === 'Battery') return [[0.75, -0.5], [-0.75, 0.0]]; // Adjusted to 0.75, VCC -0.5, GND 0.0
        if (type === 'Motor') return [[-0.375, 0], [0.375, 0]];
        if (type === 'Buzzer') return [[0.25, 0], [-0.25, 0]];
        if (type === 'Potentiometer') return [[-PITCH, 0], [0, 0], [PITCH, 0]];
        return [];
    }, []);

    const handleSceneMove = (e: ThreeEvent<PointerEvent>) => {
        if (!ghostType) return;
        setGhostPos(getSnappedPos(e.point, ghostType));
    };

    const handleSceneClick = (e: ThreeEvent<PointerEvent>) => {
        handleResumeAudio(); // Ensure audio is resumed on interaction
        if (ghostType || wiringMode) {
            e.stopPropagation();
            const targetPos = getSnappedPos(e.point, ghostType || undefined);

            if (ghostType) {
                // Breadboard: always place at origin, only one allowed
                if (ghostType === 'Breadboard') {
                    const hasBreadboard = components.some(c => c.type === 'Breadboard');
                    if (!hasBreadboard) {
                        setComponents(prev => [...prev, { id: 'breadboard-0', type: 'Breadboard' as ComponentType, pins: [], state: { pos: BB_POS } }]);
                    }
                    setGhostType(null);
                    return;
                }

                const id = `${ghostType}-${Date.now()}`;
                let pins: Pin[] = [];
                if (ghostType === 'LED') pins = [
                    { id: 'anode', pos: [PITCH / 2, 0, 0], polarity: 'positive' },
                    { id: 'cathode', pos: [-PITCH / 2, 0, 0], polarity: 'negative' }
                ];
                else if (ghostType === 'Resistor') pins = [
                    { id: 'p1', pos: [0.5, 0, 0] },
                    { id: 'p2', pos: [-0.5, 0, 0] }
                ];
                else if (ghostType === 'Switch') pins = [
                    { id: 'p1', pos: [-0.25, 0, 0] },
                    { id: 'p2', pos: [0.25, 0, 0] }
                ];
                else if (ghostType === 'Battery') pins = [
                    { id: 'vcc', pos: [0.75, 0, -0.5], polarity: 'positive' },
                    { id: 'gnd', pos: [-0.75, 0, 0.0], polarity: 'negative' }
                ];
                else if (ghostType === 'Motor') pins = [
                    { id: 'p1', pos: [-0.375, 0, 0] },
                    { id: 'p2', pos: [0.375, 0, 0] }
                ];
                else if (ghostType === 'Buzzer') pins = [
                    { id: 'pos', pos: [0.25, 0, 0], polarity: 'positive' },
                    { id: 'neg', pos: [-0.25, 0, 0], polarity: 'negative' }
                ];
                else if (ghostType === 'Potentiometer') pins = [
                    { id: 'p1', pos: [-PITCH, 0, 0] },
                    { id: 'wiper', pos: [0, 0, 0] },
                    { id: 'p3', pos: [PITCH, 0, 0] }
                ];

                const newComp: ComponentData = {
                    id,
                    type: ghostType as any,
                    pins,
                    state: { pos: targetPos, color: ghostType === 'LED' ? ledColor : undefined, isOpen: false }
                };
                setComponents(prev => [...prev, newComp]);
                setGhostType(null);
                setSelectedId(id);

                // Advance tutorial (removed)
                // if (showTutorial && TUTORIAL_STEPS[tutorialStep]?.componentType === ghostType) {
                //     setTutorialStep(prev => prev + 1);
                // }
            } else if (wiringMode) {
                // Snap wire endpoints to breadboard surface
                let finalPos: [number, number, number] = [targetPos[0], 0.22, targetPos[2]];

                // Magnetic Wiring Snap
                if (!guideComplete && GUIDE_STEPS[guideStepIndex]?.requiredComponent === 'Wire') {
                    const step = GUIDE_STEPS[guideStepIndex];
                    const target = !wireStart ? step.targetPos : step.wireEndPos;
                    if (target) {
                        // Check 2D distance (X, Z) ignoring Y
                        const dist = Math.sqrt(Math.pow(finalPos[0] - target[0], 2) + Math.pow(finalPos[2] - target[2], 2));
                        if (dist < 1.0) {
                            finalPos = target as [number, number, number];
                        }
                    }
                }

                if (!wireStart) {
                    setWireStart(finalPos);
                } else {
                    setWires(prev => [...prev, { id: `wire-${Date.now()}`, start: wireStart, end: finalPos, color: wireColor }]);
                    setWireStart(null);
                    // Don't exit wiring mode so user can create multiple wires
                }
            }
            return;
        }
    };

    const updatePosition = (id: string, newPos: [number, number, number]) => {
        setComponents(prev => prev.map(c => c.id === id ? { ...c, state: { ...c.state, pos: newPos } } : c));
    };

    const deleteSelected = () => {
        if (selectedId) {
            setComponents(prev => prev.filter(c => c.id !== selectedId));
            setWires(prev => prev.filter(w => w.id !== selectedId));
            setSelectedId(null);
        }
    };

    // Tutorial step removed

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', background: '#f8f9fa', color: '#1a1a1a', overflow: 'hidden', userSelect: 'none', fontFamily: '"Outfit", sans-serif' }}>

            {/* ===== LEFT SIDEBAR ===== */}
            <div style={{ width: '320px', background: '#fff', borderRight: '1px solid #eee', padding: '30px 20px', zIndex: 100, display: 'flex', flexDirection: 'column', boxShadow: '10px 0 40px rgba(0,0,0,0.03)' }}>
                {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#00bbee', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', padding: '0 0 12px 0', textAlign: 'left', fontFamily: 'inherit' }}>{t('lab.back')}</button>}
                <div style={{ fontSize: '0.6rem', color: '#00bbee', letterSpacing: '4px', fontWeight: '900', marginBottom: '4px' }}>{t('app.title')}</div>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 20px 0', fontWeight: '900', color: '#111' }}>{t('app.components')}</h2>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {SIDEBAR_ITEMS.map(item => {
                        const isActive = ghostType === item.type || (wiringMode && item.type === 'Wire');
                        return (
                            <div
                                key={item.type}
                                onClick={() => {
                                    if (item.type === 'Wire') { setWiringMode(true); setGhostType(null); }
                                    else { setGhostType(item.type); setWiringMode(false); setWireStart(null); }
                                }}
                                style={{
                                    padding: '16px 18px', marginBottom: '10px', background: isActive ? '#e6f7ff' : '#fafafa',
                                    borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
                                    border: `2px solid ${isActive ? '#00bbee' : '#f0f0f0'}`,
                                    transition: 'all 0.15s',
                                }}
                            >
                                <div style={{ fontSize: '2rem' }}>{item.icon}</div>
                                <div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: '800' }}>{t(item.labelKey)}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#888' }}>{t(item.descKey)}</div>
                                </div>
                            </div>
                        );
                    })}

                    {/* LED Color Picker */}
                    {ghostType === 'LED' && (
                        <div style={{ padding: '14px', background: '#fff5f5', borderRadius: '14px', marginTop: '6px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#666', marginBottom: '8px' }}>{t('led.color')}</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {LED_COLORS.map(lc => (
                                    <div
                                        key={lc.hex}
                                        onClick={() => setLedColor(lc.hex)}
                                        style={{
                                            width: 28, height: 28, borderRadius: '50%', background: lc.hex, cursor: 'pointer',
                                            border: ledColor === lc.hex ? '3px solid #00bbee' : '2px solid #ddd',
                                            boxShadow: ledColor === lc.hex ? '0 0 8px rgba(0,187,238,0.4)' : 'none',
                                        }}
                                        title={lc.name}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Wire Color Picker */}
                    {wiringMode && (
                        <div style={{ padding: '12px', background: '#f0f8ff', borderRadius: '16px', marginTop: '6px', border: '1px solid #cceeff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#0077bb', letterSpacing: '1px' }}>{t('wire.color')}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '10px' }}>
                                {WIRE_COLORS.map(wc => (
                                    <div
                                        key={wc.hex}
                                        onClick={() => setWireColor(wc.hex)}
                                        style={{
                                            width: 24, height: 24, borderRadius: '6px', background: wc.hex, cursor: 'pointer',
                                            border: wireColor === wc.hex ? '3px solid #00bbee' : '1px solid rgba(0,0,0,0.1)',
                                            boxShadow: wireColor === wc.hex ? '0 0 10px rgba(0,187,238,0.5)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        title={wc.name}
                                    />
                                ))}
                            </div>
                            {wireStart && (
                                <div style={{ background: '#fff', padding: '10px', borderRadius: '10px', border: '1px solid #00bbee33', textAlign: 'center', animation: 'pulse 1.5s infinite ease-in-out' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#00bbee', fontWeight: '800' }}>{t('wire.clickSecond')}</div>
                                </div>
                            )}
                            <button onClick={() => { setWiringMode(false); setWireStart(null); }} style={{ width: '100%', marginTop: '10px', padding: '10px', background: '#00bbee', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '900', boxShadow: '0 4px 12px rgba(0,187,238,0.2)' }}>{t('wire.done')}</button>
                        </div>
                    )}
                </div>

                {/* Selection actions */}
                {selectedId && (
                    <button onClick={deleteSelected} style={{ marginTop: '12px', padding: '14px', background: '#fff', color: '#ff4444', border: '2px solid #ff444422', borderRadius: '14px', cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem' }}>{t('action.remove')}</button>
                )}

                {/* Circuit Status */}
                <div style={{ marginTop: '16px', padding: '16px', background: circuitState.isComplete ? '#e6ffe6' : '#fafafa', borderRadius: '14px', border: `1px solid ${circuitState.isComplete ? '#66cc66' : '#eee'}` }}>
                    <div style={{ fontSize: '0.65rem', color: '#999', fontWeight: '800', letterSpacing: '2px', marginBottom: '4px' }}>{t('circuit.label')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: circuitState.isComplete ? '#22aa44' : '#999' }}>
                        {circuitState.isComplete ? t('circuit.connected') : t('circuit.open')}
                    </div>
                </div>
            </div>

            {/* ===== 3D VIEWPORT ===== */}
            <div style={{ flex: 1, position: 'relative' }}>
                <Canvas shadows camera={{ position: [0, 16, 0.1], fov: 35 }}>
                    <Suspense fallback={null}>
                        <OrbitControls ref={orbitRef} makeDefault enabled={!ghostType && !wiringMode && !wireStart} dampingFactor={0.1} minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
                        <CameraController orbitRef={orbitRef} joystickRef={joystickDelta} />
                        <ambientLight intensity={0.7} />
                        <spotLight position={[15, 30, 15]} intensity={2.5} angle={0.2} penumbra={1} castShadow shadow-mapSize={[2048, 2048]} />
                        <pointLight position={[-10, 15, -10]} intensity={0.8} />

                        {/* Ground plane */}
                        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, 0]} onPointerDown={handleSceneClick} onPointerMove={handleSceneMove}>
                            <planeGeometry args={[200, 200]} />
                            <meshStandardMaterial color="#f5f4f0" roughness={0.9} />
                        </mesh>
                        <ContactShadows position={[0, -0.2, 0]} opacity={0.35} scale={40} blur={2.5} far={10} />
                        <Grid args={[100, 100]} cellColor="#e9ecef" sectionColor="#dee2e6" position={[0, -0.2, 0]} />

                        {/* BREADBOARD — rendered only when placed */}
                        {components.some(c => c.type === 'Breadboard') && (
                            <Breadboard isInteracting={!!ghostType || wiringMode} onSceneClick={handleSceneClick} />
                        )}

                        {/* Components — fixed in place (not draggable) */}
                        {components.map((c) => {
                            const active = circuitState.components[c.id]?.active;
                            const intensity = circuitState.components[c.id]?.intensity || 1.0;
                            const isInteracting = !!ghostType || wiringMode;
                            const isSelected = selectedId === c.id;
                            const props = { pos: c.state.pos, onDrag: (p: any) => updatePosition(c.id, p), onSelect: () => setSelectedId(c.id), isInteracting, selected: isSelected, draggable: false };
                            if (c.type === 'Battery') return <RealisticBattery key={c.id} {...props} />;
                            if (c.type === 'LED') return <RealisticLED key={c.id} {...props} color={c.state.color} active={active} />;
                            if (c.type === 'Resistor') return <RealisticResistor key={c.id} {...props} />;
                            if (c.type === 'Switch') return <RealisticSwitch key={c.id} {...props} isOpen={c.state.isOpen} onAudioResume={handleResumeAudio} onToggle={() => setComponents(prev => prev.map(comp => comp.id === c.id ? { ...comp, state: { ...comp.state, isOpen: !comp.state.isOpen } } : comp))} />;
                            if (c.type === 'Motor') return <RealisticMotor key={c.id} {...props} active={active} intensity={intensity} />;
                            if (c.type === 'Buzzer') return <RealisticBuzzer key={c.id} {...props} active={active} intensity={intensity} />;
                            if (c.type === 'Potentiometer') return <RealisticPotentiometer key={c.id} {...props} value={c.state.value} onValueChange={(v: number) => setComponents(prev => prev.map(comp => comp.id === c.id ? { ...comp, state: { ...comp.state, value: v } } : comp))} />;
                            return null;
                        })}

                        {/* Wires */}
                        {wires.map(w => <JumperWire key={w.id} start={w.start} end={w.end} color={w.color} />)}

                        {/* Ghost preview with hole highlights (User's cursor position) */}
                        {ghostType && (
                            <group>
                                {/* Semi-transparent component silhouette */}
                                <group position={[ghostPos[0], ghostPos[1] + 0.3, ghostPos[2]]}>
                                    <mesh>
                                        <boxGeometry args={[0.3, 0.3, 0.3]} />
                                        <meshStandardMaterial color="#00bbee" transparent opacity={0.15} wireframe />
                                    </mesh>
                                </group>
                                {/* Green circles at exact breadboard hole positions where leads will land */}
                                {getGhostPinOffsets(ghostType).map(([dx, dz], i) => (
                                    <group key={i} position={[ghostPos[0] + dx, 0.22, ghostPos[2] + dz]}>
                                        {/* Glowing ring on the breadboard surface */}
                                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                            <ringGeometry args={[0.06, 0.1, 32]} />
                                            <meshStandardMaterial color="#22cc66" emissive="#22cc66" emissiveIntensity={3} transparent opacity={0.85} side={THREE.DoubleSide} />
                                        </mesh>
                                        {/* Inner filled dot */}
                                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                            <circleGeometry args={[0.05, 32]} />
                                            <meshStandardMaterial color="#22cc66" emissive="#22cc66" emissiveIntensity={2} transparent opacity={0.5} side={THREE.DoubleSide} />
                                        </mesh>
                                    </group>
                                ))}
                                {/* Guide line for LED snapping visual */}
                                {ghostType === 'LED' && (
                                    <mesh position={[ghostPos[0], 0.25, ghostPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                                        <planeGeometry args={[0.25, 0.02]} />
                                        <meshBasicMaterial color="#00bbee" opacity={0.5} transparent />
                                    </mesh>
                                )}
                            </group>
                        )}

                        {/* ======================= */}
                        {/*   GUIDE GHOST OVERLAY   */}
                        {/* ======================= */}
                        {!guideComplete && GUIDE_STEPS[guideStepIndex] && (
                            <group>
                                {(() => {
                                    const step = GUIDE_STEPS[guideStepIndex];
                                    const { targetPos, requiredComponent, wireEndPos } = step;

                                    // If it's a wire, draw a line/curve hinting the connection
                                    if (requiredComponent === 'Wire' && wireEndPos) {
                                        return (
                                            <group>
                                                {/* Pulsing Start Dot */}
                                                <mesh position={[targetPos[0], 0.3, targetPos[2]]}>
                                                    <sphereGeometry args={[0.15, 16, 16]} />
                                                    <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
                                                </mesh>
                                                {/* Pulsing End Dot */}
                                                <mesh position={[wireEndPos[0], 0.3, wireEndPos[2]]}>
                                                    <sphereGeometry args={[0.15, 16, 16]} />
                                                    <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
                                                </mesh>
                                                {/* Hint Line */}
                                                <JumperWire start={targetPos} end={wireEndPos!} color="#ffff00" />
                                            </group>
                                        )
                                    }

                                    // Render Ghost of the *Required* component at target location
                                    const GhostComp = () => {
                                        const props = { pos: targetPos, onDrag: () => { }, onSelect: () => { }, isInteracting: true, selected: false };

                                        // We wrap it in a group to apply ghost material effect (e.g. pulsing, transparent)
                                        // Since we can't easily override materials inside complex sub-components without context,
                                        // we'll just render a high-visibility marker or the component itself with some overlay.

                                        // Simple Marker for now:
                                        return (
                                            <group position={targetPos}>
                                                {/* Pulsing Highlight Box */}
                                                <mesh position={[0, 0.5, 0]}>
                                                    <boxGeometry args={[1, 1, 1]} />
                                                    <meshBasicMaterial color="#ffff00" transparent opacity={0.2} wireframe />
                                                </mesh>
                                                {/* 3D Arrow pointing down */}
                                                <group position={step.arrowOffset || [0, 2, 0]}>
                                                    <mesh position={[0, 0.5, 0]}>
                                                        <boxGeometry args={[0.1, 1, 0.1]} />
                                                        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
                                                    </mesh>
                                                    <mesh position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
                                                        <coneGeometry args={[0.3, 0.6, 16]} />
                                                        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
                                                    </mesh>
                                                </group>
                                            </group>
                                        );
                                    };

                                    return <GhostComp />;
                                })()}
                            </group>
                        )}
                    </Suspense>
                </Canvas>

                <div style={{
                    position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px 20px', borderRadius: '30px',
                    fontWeight: 'bold', fontSize: '0.9rem', pointerEvents: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    {!guideComplete ? (
                        <>
                            <span style={{ color: '#ffff00', fontSize: '1.2rem' }}>👉</span>
                            {GUIDE_STEPS[guideStepIndex]?.guideKey ? t(GUIDE_STEPS[guideStepIndex].guideKey) : t('guide.loading')}
                        </>
                    ) : (
                        <>
                            <span style={{ color: '#22cc44', fontSize: '1.2rem' }}>🎉</span>
                            {t('guide.complete')}
                        </>
                    )}
                </div>

                {/* KYC Button - Top Right */}
                <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 400 }}>
                    <button
                        onClick={() => setShowKYC(true)}
                        style={{
                            background: 'rgba(20,20,40,0.8)', color: 'white', padding: '12px 24px', borderRadius: '30px',
                            fontWeight: 800, fontSize: '1rem', cursor: 'pointer', border: '2px solid rgba(0,187,238,0.5)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(0,187,238,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(20,20,40,0.8)'; }}
                    >
                        KYC
                    </button>
                </div>

                {/* KYC Modal */}
                {showKYC && <KYCModal onClose={() => setShowKYC(false)} />}

                {/* Wire mode hint */}
                {wiringMode && wireStart && (
                    <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#00bbee', color: '#fff', padding: '12px 30px', borderRadius: '14px', fontWeight: '800', fontSize: '0.9rem', boxShadow: '0 8px 30px rgba(0,187,238,0.3)', zIndex: 200 }}>
                        {t('wire.clickSecondShort')}
                    </div>
                )}
                {/* ===== JOYSTICK CONTROLLER ===== */}
                <div
                    style={{
                        position: 'absolute', bottom: 24, right: 24, width: 120, height: 120,
                        borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(12px)', border: '2px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 300,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        touchAction: 'none', userSelect: 'none',
                    }}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;
                        const knob = e.currentTarget.querySelector('.joystick-knob') as HTMLElement;

                        const onMove = (ev: PointerEvent) => {
                            const dx = Math.max(-1, Math.min(1, (ev.clientX - cx) / 50));
                            const dy = Math.max(-1, Math.min(1, (ev.clientY - cy) / 50));
                            joystickDelta.current = [dx, dy];
                            if (knob) {
                                knob.style.transform = `translate(${dx * 30}px, ${dy * 30}px)`;
                            }
                        };
                        const onUp = () => {
                            joystickDelta.current = [0, 0];
                            if (knob) knob.style.transform = 'translate(0px, 0px)';
                            window.removeEventListener('pointermove', onMove);
                            window.removeEventListener('pointerup', onUp);
                        };
                        window.addEventListener('pointermove', onMove);
                        window.addEventListener('pointerup', onUp);
                    }}
                >
                    {/* Direction arrows */}
                    <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 900 }}>▲</div>
                    <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 900 }}>▼</div>
                    <div style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 900 }}>◀</div>
                    <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 900 }}>▶</div>
                    {/* Knob */}
                    <div
                        className="joystick-knob"
                        style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00bbee, #0088cc)',
                            boxShadow: '0 4px 16px rgba(0,187,238,0.4)',
                            border: '2px solid rgba(255,255,255,0.6)',
                            transition: 'transform 0.08s ease-out',
                            cursor: 'grab',
                        }}
                    />
                    {/* Label */}
                    <div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: '#999', fontWeight: 800, letterSpacing: 1, whiteSpace: 'nowrap' }}>{t('camera.view')}</div>
                </div>
                {/* Zoom Controls */}
                <div style={{ position: 'absolute', bottom: 156, right: 24, zIndex: 300, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={() => {
                            if (orbitRef.current) {
                                const cam = orbitRef.current.object;
                                cam.position.multiplyScalar(0.85); // Zoom in by moving closer
                                // clamp
                                if (cam.position.length() < 5) cam.position.setLength(5);
                                orbitRef.current.update();
                            }
                        }}
                        style={{
                            width: 44, height: 44, borderRadius: '50%', background: 'white',
                            border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            fontSize: '1.4rem', fontWeight: 800, color: '#333', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >+</button>
                    <button
                        onClick={() => {
                            if (orbitRef.current) {
                                const cam = orbitRef.current.object;
                                cam.position.multiplyScalar(1.15); // Zoom out
                                if (cam.position.length() > 30) cam.position.setLength(30);
                                orbitRef.current.update();
                            }
                        }}
                        style={{
                            width: 44, height: 44, borderRadius: '50%', background: 'white',
                            border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            fontSize: '1.4rem', fontWeight: 800, color: '#333', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >−</button>
                </div>

                {/* Sound Status Button — Bottom Left (next to settings) */}
                <div style={{ position: 'absolute', bottom: 24, left: 84, zIndex: 400 }}>
                    <button
                        onClick={handleResumeAudio}
                        title={audioStatus === 'suspended' ? t('audio.enable') : t('audio.realistic')}
                        style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: audioStatus === 'suspended' ? 'rgba(255,50,50,0.4)' : 'rgba(0,187,238,0.4)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff', fontSize: '1.4rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: audioStatus === 'suspended' ? '0 0 15px rgba(255,50,50,0.3)' : '0 0 15px rgba(0,187,238,0.3)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
                    >
                        {audioStatus === 'suspended' ? '🔇' : '🔊'}
                    </button>
                    {/* Tooltip hint if suspended */}
                    {audioStatus === 'suspended' && (
                        <div style={{
                            position: 'absolute', bottom: 60, left: 0,
                            background: 'rgba(0,0,0,0.8)', color: 'white', padding: '6px 12px',
                            borderRadius: '8px', fontSize: '0.75rem', whiteSpace: 'nowrap',
                            pointerEvents: 'none', animation: 'bounce 2s infinite'
                        }}>
                            {t('audio.enable')}
                        </div>
                    )}
                </div>

                {/* Video and Diagram Buttons — Above Settings */}
                {guideComplete && (
                    <div style={{ position: 'absolute', bottom: 84, left: 24, zIndex: 400, display: 'flex', gap: '12px' }}>
                        {EXPERIMENT_VIDEOS[experimentId] && (
                            <button
                                onClick={() => setShowVideoModal(true)}
                                title={t('video.watch')}
                                style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: 'rgba(255, 215, 0, 0.8)',
                                    backdropFilter: 'blur(12px)',
                                    border: '2px solid rgba(255, 255, 255, 0.4)',
                                    color: '#000', fontSize: '1.4rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4)',
                                    animation: 'pulse-yellow 2s infinite ease-in-out'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2) rotate(-5deg)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
                            >
                                🎬
                            </button>
                        )}
                        {EXPERIMENT_DIAGRAMS[experimentId] && (
                            <button
                                onClick={() => setShowDiagramModal(true)}
                                title="Circuit Diagram"
                                style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(12px)',
                                    border: '2px solid rgba(0, 0, 0, 0.2)',
                                    color: '#000', fontSize: '1.4rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    boxShadow: '0 8px 32px rgba(255, 255, 255, 0.4)',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2) rotate(5deg)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
                            >
                                ✏️
                            </button>
                        )}
                    </div>
                )}

                {/* Circuit Diagram Modal Overlay */}
                {showDiagramModal && EXPERIMENT_DIAGRAMS[experimentId] && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2000, padding: '24px'
                    }}>
                        <div style={{
                            width: '100%', maxWidth: '800px', background: '#fff', borderRadius: '24px',
                            overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.2)', position: 'relative',
                            border: '1px solid rgba(0,0,0,0.1)'
                        }}>
                            <div style={{
                                padding: '20px 30px', background: 'linear-gradient(to right, #f8f9fa, #e9ecef)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderBottom: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ color: '#111', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                                    ✏️ Pencil Circuit Diagram
                                </div>
                                <button
                                    onClick={() => setShowDiagramModal(false)}
                                    style={{
                                        background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
                                        width: '40px', height: '40px', color: '#111',
                                        fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,0,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                                >
                                    ✕
                                </button>
                            </div>
                            <div style={{ width: '100%', aspectRatio: '4/3', backgroundColor: '#f8f9fa', position: 'relative' }}>
                                <img 
                                    src={EXPERIMENT_DIAGRAMS[experimentId]} 
                                    alt="Circuit Diagram" 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Video Modal Overlay */}
                {showVideoModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2000, padding: '24px'
                    }}>
                        <div style={{
                            width: 'min(90%, 960px)', background: '#111', borderRadius: '32px',
                            overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)',
                            boxShadow: '0 32px 64px rgba(0,0,0,0.8)', position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                                    {t('video.title')}: <span style={{ color: '#00bbee' }}>{EXPERIMENT_VIDEOS[experimentId]?.title}</span>
                                </div>
                                <button
                                    onClick={() => setShowVideoModal(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                                        width: '40px', height: '40px', color: '#fff', cursor: 'pointer',
                                        fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,50,50,0.4)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                >✕</button>
                            </div>
                            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                                <iframe
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                    src={EXPERIMENT_VIDEOS[experimentId]?.url + "?autoplay=1"}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== SETTINGS GEAR — Bottom Left ===== */}
                <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 400, display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                            transition: 'transform 0.2s, background 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
                    >⚙️</button>

                    {/* Voice Toggle */}
                    <button
                        onClick={() => {
                            const newState = !isVoiceActive;
                            setIsVoiceActive(newState);
                            if (newState) {
                                voiceSystem.speak(t('voice.enabled') || "Voice activated", language);
                            } else {
                                voiceSystem.speak(t('voice.disabled') || "Voice deactivated", language);
                            }
                        }}
                        style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: isVoiceActive ? 'rgba(0,187,238,0.3)' : 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(12px)',
                            border: isVoiceActive ? '1px solid #00bbee' : '1px solid rgba(255,255,255,0.15)',
                            color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isVoiceActive ? '0 0 20px rgba(0,187,238,0.4)' : '0 4px 16px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        {isVoiceActive ? '🎙️' : '🔇'}
                        {isVoiceActive && (
                            <div style={{
                                position: 'absolute', top: -4, right: -4,
                                width: 12, height: 12, background: '#00ff00',
                                borderRadius: '50%', border: '2px solid #1a1a2e',
                                animation: 'pulse 1.5s infinite'
                            }} />
                        )}
                    </button>

                    {showLangMenu && (
                        <div style={{
                            position: 'absolute', bottom: 60, left: 0,
                            background: 'rgba(20,20,40,0.95)', backdropFilter: 'blur(30px)',
                            borderRadius: 16, padding: '12px 8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                            minWidth: 180,
                        }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', padding: '4px 12px 8px', textTransform: 'uppercase' }}>
                                {t('settings.title')}
                            </div>
                            {LANG_OPTIONS.map(lang => (
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
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800;900&display=swap');
                body { margin: 0; background: #f8f9fa; }
             `}</style>
            <style jsx global>{`
                @keyframes pulse-yellow {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(255, 215, 0, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
                }
            `}</style>
        </div>
    );
}
