/**
 * Tests for Controls component
 */

import { test, expect, describe, beforeEach, mock } from 'bun:test';
import { h, render } from 'preact';
import htm from 'htm';
import { Controls } from './Controls.mjs';
import * as presetManager from '../preset-manager.mjs';

// DOM environment is set up globally in setup.test.mjs

// Create real HTML template tag
const html = htm.bind(h);

// Helper to render Controls with specific state
const renderControls = (settings, presets, showAdvancedControls = false, send = mock(() => {})) => {
    const container = document.createElement('div');

    render(
        Controls({ html, settings, presets, showAdvancedControls, send }),
        container
    );

    return container;
};

describe('Controls', () => {
    beforeEach(() => {
        // Cleanup if needed
    });

    const defaultSettings = {
        lengthValue: 500,
        intensityValue: 0.8,
        pauseValue: 1000,
        repeatMode: 'unlimited',
        repeatCount: 5,
        repeatCountDisplay: '5',
        showRepeatCount: false
    };

    const defaultPresets = {
        presetOptions: [
            { value: 'preset1', text: 'Preset 1' },
            { value: 'preset2', text: 'Preset 2' }
        ],
        selectedPreset: 'preset1',
        presetActive: true
    };

    test('renders basic controls structure', () => {
        const container = renderControls(defaultSettings, defaultPresets);

        // Check main container
        const controlsDiv = container.querySelector('.controls');
        expect(controlsDiv).toBeDefined();

        // Check preset select
        const presetSelect = container.querySelector('#presetSelect');
        expect(presetSelect).toBeDefined();
        expect(presetSelect?.value).toBe('preset1');

        // Check advanced controls toggle (should be visible for non-custom preset)
        const toggleButton = container.querySelector('.toggle-advanced-btn');
        expect(toggleButton).toBeDefined();
        expect(toggleButton?.textContent?.trim()).toBe('▶ Show Advanced Settings');
    });

    test('shows advanced controls when showAdvancedControls is true', () => {
        const container = renderControls(defaultSettings, defaultPresets, true);

        const advancedControls = container.querySelector('.advanced-controls');
        expect(advancedControls).toBeDefined();
        expect(advancedControls?.style.display).toBe('block');

        const toggleButton = container.querySelector('.toggle-advanced-btn');
        expect(toggleButton?.textContent?.trim()).toBe('▼ Hide Advanced Settings');
    });

    test('hides advanced controls toggle for custom preset', () => {
        const customPresets = {
            ...defaultPresets,
            selectedPreset: presetManager.CUSTOM_PRESET_ID
        };
        const container = renderControls(defaultSettings, customPresets, false);

        const toggleButton = container.querySelector('.toggle-advanced-btn');
        expect(toggleButton).toBeNull();

        // Advanced controls should be visible for custom preset
        const advancedControls = container.querySelector('.advanced-controls');
        expect(advancedControls).toBeDefined();
        expect(advancedControls?.style.display).toBe('block');
    });

    test('renders sliders with correct values', () => {
        const container = renderControls(defaultSettings, defaultPresets, true);

        const lengthSlider = container.querySelector('#lengthSlider');
        expect(lengthSlider).toBeDefined();
        expect(lengthSlider?.value).toBe('500');

        const intensitySlider = container.querySelector('#intensitySlider');
        expect(intensitySlider).toBeDefined();
        expect(intensitySlider?.value).toBe('0.8');

        const pauseSlider = container.querySelector('#pauseSlider');
        expect(pauseSlider).toBeDefined();
        expect(pauseSlider?.value).toBe('1000');
    });

    test('shows repeat count input when repeat mode is count', () => {
        const countSettings = {
            ...defaultSettings,
            repeatMode: 'count',
            showRepeatCount: true
        };
        const container = renderControls(countSettings, defaultPresets, true);

        const repeatCountGroup = container.querySelector('#repeatCountGroup');
        expect(repeatCountGroup).toBeDefined();
        expect(repeatCountGroup?.style.display).toBe('block');

        const repeatCountInput = container.querySelector('#repeatCountInput');
        expect(repeatCountInput).toBeDefined();
        expect(repeatCountInput?.value).toBe('5');
    });

    test('hides repeat count input when repeat mode is unlimited', () => {
        const container = renderControls(defaultSettings, defaultPresets, true);

        const repeatCountGroup = container.querySelector('#repeatCountGroup');
        expect(repeatCountGroup).toBeDefined();
        expect(repeatCountGroup?.style.display).toBe('none');
    });

    test('dispatches setLength when length slider changes', () => {
        const send = mock(() => {});
        const container = renderControls(defaultSettings, defaultPresets, true, send);

        const lengthSlider = container.querySelector('#lengthSlider');
        if (lengthSlider) {
            lengthSlider.value = '750';
            lengthSlider.dispatchEvent(new Event('input'));
        }

        expect(send).toHaveBeenCalledWith({ type: 'setLength', value: 750 });
    });

    test('dispatches setIntensity when intensity slider changes', () => {
        const send = mock(() => {});
        const container = renderControls(defaultSettings, defaultPresets, true, send);

        const intensitySlider = container.querySelector('#intensitySlider');
        if (intensitySlider) {
            intensitySlider.value = '0.6';
            intensitySlider.dispatchEvent(new Event('input'));
        }

        expect(send).toHaveBeenCalledWith({ type: 'setIntensity', value: 0.6 });
    });

    test('dispatches setPause when pause slider changes', () => {
        const send = mock(() => {});
        const container = renderControls(defaultSettings, defaultPresets, true, send);

        const pauseSlider = container.querySelector('#pauseSlider');
        if (pauseSlider) {
            pauseSlider.value = '1500';
            pauseSlider.dispatchEvent(new Event('input'));
        }

        expect(send).toHaveBeenCalledWith({ type: 'setPause', value: 1500 });
    });

    test('dispatches applyPreset when preset is selected', () => {
        const send = mock(() => {});
        const container = renderControls(defaultSettings, defaultPresets, false, send);

        const presetSelect = container.querySelector('#presetSelect');
        if (presetSelect) {
            presetSelect.value = 'preset2';
            presetSelect.dispatchEvent(new Event('change'));
        }

        expect(send).toHaveBeenCalledWith({ type: 'applyPreset', presetId: 'preset2', persist: true });
    });

    test('dispatches toggleAdvancedControls when toggle button is clicked', () => {
        const send = mock(() => {});
        const container = renderControls(defaultSettings, defaultPresets, false, send);

        const toggleButton = container.querySelector('.toggle-advanced-btn');
        toggleButton?.click();

        expect(send).toHaveBeenCalledWith({ type: 'toggleAdvancedControls' });
    });

    test('returns a function component', () => {
        expect(typeof Controls).toBe('function');
    });
});