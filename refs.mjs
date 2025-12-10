/**
 * Non-reactive refs storage for DOM elements and mutable instances
 */

import { CUSTOM_PRESET_ID } from './preset-manager.mjs';

export const refs = {
    joyCon: null,
    appMachineActor: null, // The app machine actor/service
    currentRumbleAbortController: { current: null },
    currentRumblePromise: { current: null },
    activePresetId: { current: CUSTOM_PRESET_ID },
    isApplyingPreset: { current: false },
    lengthSlider: null,
    intensitySlider: null,
    pauseSlider: null,
    repeatCountInput: null,
    presetSelect: null
};
