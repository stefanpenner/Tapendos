/**
 * Bilateral Stimulation Presets
 * 
 * Practical presets for different therapeutic and relaxation needs.
 */

export const PRESETS = [
    {
        id: 'deep-relaxation',
        name: 'Deep Relaxation',
        tagline: 'slow, gentle waves',
        description: 'Very slow, gentle pulses ideal for deep relaxation, meditation, or sleep preparation. The extended pauses allow for complete relaxation between pulses.',
        values: { duration: 800, pauseDuration: 800, amplitude: 0.35, repeatMode: 'unlimited', repeatCount: 1 },
    },
    {
        id: 'standard-processing',
        name: 'Standard Processing',
        tagline: 'balanced 1 Hz rhythm',
        description: 'Classic bilateral stimulation pattern at 1 Hz. Well-balanced for general processing, grounding, and therapeutic work.',
        values: { duration: 250, pauseDuration: 250, amplitude: 0.6, repeatMode: 'unlimited', repeatCount: 1 },
    },
    {
        id: 'active-processing',
        name: 'Active Processing',
        tagline: 'fast 2 Hz rhythm',
        description: 'Faster-paced stimulation at 2 Hz for active processing, increased focus, or when you need more energetic bilateral stimulation.',
        values: { duration: 125, pauseDuration: 125, amplitude: 0.75, repeatMode: 'unlimited', repeatCount: 1 },
    },
    {
        id: 'gentle-flow',
        name: 'Gentle Flow',
        tagline: 'subtle background rhythm',
        description: 'Very gentle, continuous flow perfect for background stimulation during other activities or for sensitive users.',
        values: { duration: 400, pauseDuration: 400, amplitude: 0.25, repeatMode: 'unlimited', repeatCount: 1 },
    },
];

export const CUSTOM_PRESET_ID = 'custom';
export const LAST_PRESET_STORAGE_KEY = 'tapendos.activePreset';

