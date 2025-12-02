/**
 * Preset management logic
 */

import { PRESETS, CUSTOM_PRESET_ID, LAST_PRESET_STORAGE_KEY } from './presets.mjs';

export function persistPresetSelection(id) {
    try {
        localStorage.setItem(LAST_PRESET_STORAGE_KEY, id);
    } catch (error) {
        // Ignore storage limitations
    }
}

export function loadStoredPreset() {
    try {
        return localStorage.getItem(LAST_PRESET_STORAGE_KEY);
    } catch (error) {
        return null;
    }
}

export function populatePresetOptions() {
    return [
        { value: CUSTOM_PRESET_ID, text: 'Custom' },
        ...PRESETS.map(preset => ({
            value: preset.id,
            text: `${preset.name} — ${preset.tagline}`
        }))
    ];
}

export function findPreset(presetId) {
    return PRESETS.find((item) => item.id === presetId);
}

export { CUSTOM_PRESET_ID };

