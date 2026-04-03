/**
 * Advanced Circuit Simulator for Breadboard Lab
 * Simulates real electrical connectivity using a graph-based approach.
 * Standard pitch: 0.1 inch = 0.25 units.
 */

export type ComponentType = 'Battery' | 'LED' | 'Resistor' | 'Switch' | 'Breadboard' | 'Motor' | 'Buzzer' | 'Potentiometer';

export interface Pin {
    id: string;
    pos: [number, number, number]; // Relative to component center
    polarity?: 'positive' | 'negative';
}

export interface ComponentData {
    id: string;
    type: ComponentType;
    pins: Pin[];
    value?: number;
    state: {
        pos: [number, number, number];
        isOpen?: boolean;
        color?: string;
        [key: string]: any;
    };
}

export interface WireData {
    id: string;
    start: [number, number, number];
    end: [number, number, number];
    color: string;
}

export interface CircuitState {
    isComplete: boolean;
    current: number;
    components: Record<string, { active: boolean; current: number; intensity?: number }>;
}

/**
 * Maps a 3D point to a breadboard hole key.
 * Grid: 63 columns, 10 rows (a-j)
 * PLUS 4 power rails (Top Red/Blue, Bottom Red/Blue)
 */
function getHoleKey(pos: [number, number, number], bbPos: [number, number, number]): string | null {
    const PITCH = 0.25;
    const dx = pos[0] - bbPos[0];
    const dz = pos[2] - bbPos[2];

    // Col index: -31 to 31 (for center 0) -> 1 to 63
    const colRaw = Math.round(dx / PITCH);
    const col = colRaw + 32;

    if (col < 1 || col > 63) return null;

    // Inner terminal strips: 2 groups of 5 rows
    // Rows: a,b,c,d,e (Gap) f,g,h,i,j
    // z offsets: e= -0.125, d=-0.375, c=-0.625, b=-0.875, a=-1.125
    //            f=  0.125, g= 0.375, h= 0.625, i= 0.875, j= 1.125
    const rowMap = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const findRow = (zOff: number) => {
        if (zOff <= -0.1 && zOff >= -1.2) {
            const idx = 4 - Math.round(Math.abs(zOff + 0.125) / PITCH);
            return rowMap[idx];
        }
        if (zOff >= 0.1 && zOff <= 1.2) {
            const idx = 5 + Math.round(Math.abs(zOff - 0.125) / PITCH);
            return rowMap[idx];
        }
        return null;
    };

    const row = findRow(dz);
    if (row) return `${col}-${row}`;

    // Power Rails:
    // Top: Blue at -2.625, Red at -2.125 (relative to center)
    // Bottom: Red at 2.125, Blue at 2.625
    if (Math.abs(dz - (-2.625)) < 0.15) return `POWER-TOP-BLUE-${col}`;
    if (Math.abs(dz - (-2.125)) < 0.15) return `POWER-TOP-RED-${col}`;
    if (Math.abs(dz - 2.125) < 0.15) return `POWER-BOTTOM-RED-${col}`;
    if (Math.abs(dz - 2.625) < 0.15) return `POWER-BOTTOM-BLUE-${col}`;

    return null;
}

function getInternalNode(holeKey: string): string {
    if (holeKey.includes('POWER')) {
        if (holeKey.includes('RED')) return holeKey.includes('TOP') ? 'NODE-RAIL-T-RED' : 'NODE-RAIL-B-RED';
        if (holeKey.includes('BLUE')) return holeKey.includes('TOP') ? 'NODE-RAIL-T-BLUE' : 'NODE-RAIL-B-BLUE';
    }

    const [col, row] = holeKey.split('-');
    const group = ['a', 'b', 'c', 'd', 'e'].includes(row) ? 'UPPER' : 'LOWER';
    return `NODE-COL-${col}-${group}`;
}

export function solveCircuit(components: ComponentData[], wires: WireData[]): CircuitState {
    const breadboard = components.find(c => c.type === 'Breadboard');
    if (!breadboard) return { isComplete: false, current: 0, components: {} };

    const bbPos = breadboard.state.pos;
    const adj: Record<string, Set<string>> = {};
    const addEdge = (u: string, v: string) => {
        if (!adj[u]) adj[u] = new Set();
        if (!adj[v]) adj[v] = new Set();
        adj[u].add(v);
        adj[v].add(u);
    };

    // 1. Wires
    wires.forEach(w => {
        const h1 = getHoleKey(w.start, bbPos);
        const h2 = getHoleKey(w.end, bbPos);
        if (h1 && h2) addEdge(getInternalNode(h1), getInternalNode(h2));
    });

    // 2. Battery
    const battery = components.find(c => c.type === 'Battery');
    let vPosNode = '', vNegNode = '';
    if (battery) {
        battery.pins.forEach((p, idx) => {
            const h = getHoleKey([battery.state.pos[0] + p.pos[0], battery.state.pos[1], battery.state.pos[2] + p.pos[2]], bbPos);
            if (h) {
                if (idx === 0) vPosNode = getInternalNode(h);
                else vNegNode = getInternalNode(h);
            }
        });
    }

    // 3. Components as Bridges
    components.forEach(c => {
        if (c.type === 'Battery' || c.type === 'Breadboard') return;

        const nodes: string[] = [];
        c.pins.forEach(p => {
            const h = getHoleKey([c.state.pos[0] + p.pos[0], c.state.pos[1], c.state.pos[2] + p.pos[2]], bbPos);
            if (h) nodes.push(getInternalNode(h));
        });

        if (nodes.length >= 2) {
            const n1 = nodes[0], n2 = nodes[1];
            // Closed switch or resistor/led acts as wire for basic pathfinding
            if (!(c.type === 'Switch' && c.state.isOpen)) {
                addEdge(n1, n2);
            }

            // Potentiometer: Pins 1-2 or 2-3 based on rotation? 
            // For now, let's treat it as a 3-pin bridge where Pin 2 is the wiper.
            if (c.type === 'Potentiometer' && nodes.length >= 3) {
                // Pin 1 (CCW), Pin 2 (Wiper), Pin 3 (CW)
                // Treat as connected for connectivity, intensity is handled separately
                addEdge(nodes[0], nodes[1]);
                addEdge(nodes[1], nodes[2]);
            }
        }
    });

    // 4. Verification logic (DFS for Path)
    const canReach = (start: string, target: string): boolean => {
        if (!start || !target) return false;
        const visited = new Set<string>();
        const queue = [start];
        while (queue.length > 0) {
            const curr = queue.shift()!;
            if (curr === target) return true;
            if (visited.has(curr)) continue;
            visited.add(curr);
            const neighbors = adj[curr];
            if (neighbors) {
                neighbors.forEach(n => {
                    if (!visited.has(n)) queue.push(n);
                });
            }
        }
        return false;
    };

    const isComplete = canReach(vPosNode, vNegNode);

    // 5. Polarity Check & Intensity Logic
    const componentStates: Record<string, { active: boolean, current: number, intensity?: number }> = {};
    components.forEach(c => {
        let active = isComplete;
        let intensity = 1.0;

        if (isComplete && (c.type === 'LED' || c.type === 'Motor' || c.type === 'Buzzer')) {
            // 1. Polarity Check (Primarily for LEDs)
            if (c.type === 'LED') {
                const anodePin = c.pins.find(p => p.id === 'anode') || c.pins[0];
                const h = getHoleKey([c.state.pos[0] + anodePin.pos[0], c.state.pos[1], c.state.pos[2] + anodePin.pos[2]], bbPos);
                if (h) {
                    active = canReach(vPosNode, getInternalNode(h));
                }
            }

            // 2. Intensity Logic (Potentiometer)
            // If there's a potentiometer in the active circuit, use its value
            const pot = components.find(comp => comp.type === 'Potentiometer');
            if (pot && pot.state.value !== undefined) {
                // Simple version: use the global pot value if it exists
                intensity = Math.max(0.01, pot.state.value); // Ensure it doesn't go to absolute zero for sound stability
            }
        }

        componentStates[c.id] = { active, current: active ? 0.02 * intensity : 0, intensity };
    });

    return { isComplete, current: isComplete ? 0.02 : 0, components: componentStates };
}
