/**
 * Tests for vibration controller
 */

import * as vibration from './vibration-controller.mjs';

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

    console.log('\nRunning vibration-controller tests...\n');

    test('should format amplitude display correctly', () => {
        if (vibration.formatAmplitudeDisplay(0.5) !== '0.5') {
            throw new Error(`Expected '0.5', got '${vibration.formatAmplitudeDisplay(0.5)}'`);
        }
        
        if (vibration.formatAmplitudeDisplay(0.555) !== '0.56') {
            throw new Error(`Expected '0.56', got '${vibration.formatAmplitudeDisplay(0.555)}'`);
        }
        
        if (vibration.formatAmplitudeDisplay(1) !== '1') {
            throw new Error(`Expected '1', got '${vibration.formatAmplitudeDisplay(1)}'`);
        }
    });

    test('should handle invalid amplitude values', () => {
        const result = vibration.formatAmplitudeDisplay('invalid');
        if (result !== 'invalid') {
            throw new Error(`Expected 'invalid', got '${result}'`);
        }
    });

    test('should get current config from refs and state', () => {
        const refs = {
            lengthSliderRef: { current: { value: '100' } },
            intensitySliderRef: { current: { value: '0.7' } },
            pauseSliderRef: { current: { value: '200' } },
            repeatCountInputRef: { current: { value: '5' } }
        };
        
        const state = {
            lengthValue: 500,
            intensityValue: 0.5,
            pauseValue: 800,
            repeatMode: 'count',
            repeatCount: 1
        };
        
        const config = vibration.getCurrentConfig(refs, state);
        
        if (config.duration !== 100) {
            throw new Error(`Expected duration 100, got ${config.duration}`);
        }
        if (config.amplitude !== 0.7) {
            throw new Error(`Expected amplitude 0.7, got ${config.amplitude}`);
        }
        if (config.pauseDuration !== 200) {
            throw new Error(`Expected pauseDuration 200, got ${config.pauseDuration}`);
        }
        if (config.repeatMode !== 'count') {
            throw new Error(`Expected repeatMode 'count', got '${config.repeatMode}'`);
        }
        if (config.repeatCount !== 5) {
            throw new Error(`Expected repeatCount 5, got ${config.repeatCount}`);
        }
    });

    test('should fallback to state values when refs are null', () => {
        const refs = {
            lengthSliderRef: { current: null },
            intensitySliderRef: { current: null },
            pauseSliderRef: { current: null },
            repeatCountInputRef: { current: null }
        };
        
        const state = {
            lengthValue: 500,
            intensityValue: 0.5,
            pauseValue: 800,
            repeatMode: 'unlimited',
            repeatCount: 1
        };
        
        const config = vibration.getCurrentConfig(refs, state);
        
        if (config.duration !== 500) {
            throw new Error(`Expected duration 500, got ${config.duration}`);
        }
        if (config.amplitude !== 0.5) {
            throw new Error(`Expected amplitude 0.5, got ${config.amplitude}`);
        }
    });

    console.log(`\n${passed} passed, ${failed} failed`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests();

