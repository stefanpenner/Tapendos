/**
 * Tests for preset manager
 */

import * as presetManager from './preset-manager.mjs';
import { PRESETS } from './presets.mjs';

// Simple test runner
function runTests() {
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            passed++;
            console.log(`✓ ${name}`);
        } catch (error) {
            failed++;
            console.error(`✗ ${name}: ${error.message}`);
        }
    }

    console.log('\nRunning preset-manager tests...\n');

    test('should populate preset options correctly', () => {
        const options = presetManager.populatePresetOptions();
        
        const customOption = options.find(opt => opt.value === presetManager.CUSTOM_PRESET_ID);
        if (!customOption || customOption.text !== 'Custom') {
            throw new Error('Custom option not found or incorrect');
        }
        
        if (options.length !== PRESETS.length + 1) {
            throw new Error(`Expected ${PRESETS.length + 1} options, got ${options.length}`);
        }
        
        const firstPreset = options[1];
        if (firstPreset.value !== PRESETS[0].id) {
            throw new Error(`Expected preset id '${PRESETS[0].id}', got '${firstPreset.value}'`);
        }
    });

    test('should find preset by id', () => {
        const preset = presetManager.findPreset('deep-relaxation');
        if (!preset || preset.id !== 'deep-relaxation') {
            throw new Error('Preset not found or incorrect');
        }
    });

    test('should return undefined for invalid preset id', () => {
        const preset = presetManager.findPreset('invalid-id');
        if (preset !== undefined) {
            throw new Error(`Expected undefined, got ${preset}`);
        }
    });

    test('should persist and load preset selection', () => {
        // Skip if localStorage not available (Node.js environment)
        if (typeof localStorage === 'undefined') {
            console.log('  (skipped - localStorage not available)');
            return;
        }
        
        const testId = 'test-preset-id';
        presetManager.persistPresetSelection(testId);
        const loaded = presetManager.loadStoredPreset();
        if (loaded !== testId) {
            throw new Error(`Expected '${testId}', got '${loaded}'`);
        }
        
        // Clean up
        localStorage.removeItem('tapendos.activePreset');
    });

    console.log(`\n${passed} passed, ${failed} failed`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests();

