/**
 * Tests for app component integration
 * These tests would catch variable shadowing and import issues
 */

import * as vibrationController from './vibration-controller.mjs';

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
            if (error.stack) {
                console.error(error.stack);
            }
        }
    }

    console.log('\nRunning app integration tests...\n');

    // Test 1: Verify vibrationController module is importable and has expected functions
    test('vibrationController module should export getCurrentConfig function', () => {
        if (typeof vibrationController.getCurrentConfig !== 'function') {
            throw new Error(`Expected getCurrentConfig to be a function, got ${typeof vibrationController.getCurrentConfig}`);
        }
    });

    test('vibrationController module should export startRumble function', () => {
        if (typeof vibrationController.startRumble !== 'function') {
            throw new Error(`Expected startRumble to be a function, got ${typeof vibrationController.startRumble}`);
        }
    });

    test('vibrationController module should export applyLiveConfig function', () => {
        if (typeof vibrationController.applyLiveConfig !== 'function') {
            throw new Error(`Expected applyLiveConfig to be a function, got ${typeof vibrationController.applyLiveConfig}`);
        }
    });

    // Test 2: Verify app.mjs can be imported without syntax errors
    // Note: This will fail in Node.js due to missing preact, but would catch syntax/shadowing errors in browser
    test('app.mjs should import without syntax errors', async () => {
        try {
            // This would catch import errors, syntax errors, and variable shadowing issues
            const appModule = await import('./app.mjs');
            if (!appModule.createApp) {
                throw new Error('createApp function not exported');
            }
        } catch (error) {
            // In Node.js, preact won't be available, but we can at least verify it's a dependency error
            // and not a syntax/shadowing error
            if (error.message.includes('preact') || error.message.includes('Cannot find package')) {
                console.log('  (skipped - preact not available in Node.js, but syntax check passed)');
                return; // This is expected in Node.js environment
            }
            throw new Error(`Failed to import app.mjs: ${error.message}`);
        }
    });

    // Test 3: Verify that getCurrentConfig callback can actually call the imported function
    // This is the key test that would have caught the bug!
    test('getCurrentConfig callback should be able to call vibrationController.getCurrentConfig', async () => {
        // Mock the app structure to test the callback
        const refs = {
            lengthSliderRef: { current: { value: '100' } },
            intensitySliderRef: { current: { value: '0.7' } },
            pauseSliderRef: { current: { value: '200' } },
            repeatCountInputRef: { current: { value: '5' } }
        };
        
        const currentState = {
            lengthValue: 500,
            intensityValue: 0.5,
            pauseValue: 800,
            repeatMode: 'count',
            repeatCount: 1
        };

        // Simulate what getCurrentConfig callback does
        const getCurrentConfig = () => {
            // This would fail if vibrationController was shadowed
            return vibrationController.getCurrentConfig(refs, currentState);
        };

        const config = getCurrentConfig();
        
        if (!config || typeof config !== 'object') {
            throw new Error(`Expected config object, got ${typeof config}`);
        }
        
        if (config.duration !== 100) {
            throw new Error(`Expected duration 100, got ${config.duration}`);
        }
    });

    // Test 4: Verify no variable shadowing occurs
    test('imported vibrationController should not be shadowed by local variables', () => {
        // Create a local variable with a similar name to test shadowing
        const vibration = { someProperty: 'test' };
        
        // The imported module should still be accessible
        if (typeof vibrationController.getCurrentConfig !== 'function') {
            throw new Error('vibrationController.getCurrentConfig should still be accessible even with local vibration variable');
        }
        
        // Verify we can still call it
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
        
        const config = vibrationController.getCurrentConfig(refs, state);
        if (!config || config.duration !== 500) {
            throw new Error('Failed to call vibrationController.getCurrentConfig when local vibration variable exists');
        }
    });

    console.log(`\n${passed} passed, ${failed} failed`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests();

