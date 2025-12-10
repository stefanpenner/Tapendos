/**
 * Simple Store - All application state and actions
 * Custom implementation using Preact hooks
 */

import { useState, useEffect, useRef } from 'preact/hooks';
import { JoyCon } from './joycon.mjs';
import * as presetManager from './preset-manager.mjs';
import * as vibrationController from './vibration-controller.mjs';

// Global store state
let storeState = {
    // Status
    status: { text: 'Disconnected', className: 'disconnected' },
    
    // Connection state
    leftConnected: false,
    rightConnected: false,
    leftVibrating: false,
    rightVibrating: false,
    isVibrating: false,
    
    // Vibration settings
    lengthValue: 500,
    intensityValue: 0.5,
    pauseValue: 800,
    repeatMode: 'unlimited',
    repeatCount: 1,
    repeatCountDisplay: 1,
    showRepeatCount: false,
    
    // Presets
    presetOptions: [],
    selectedPreset: presetManager.CUSTOM_PRESET_ID,
    presetActive: false,
    
    // Refs (mutable object)
    refs: {
        joyCon: null,
        currentRumbleAbortController: { current: null },
        currentRumblePromise: { current: null },
        activePresetId: { current: presetManager.CUSTOM_PRESET_ID },
        isApplyingPreset: { current: false },
        lengthSlider: null,
        intensitySlider: null,
        pauseSlider: null,
        repeatCountInput: null,
        presetSelect: null
    }
};

// Subscribers for re-renders
const subscribers = new Set();

// Shallow equality check
function shallowEqual(objA, objB) {
    if (Object.is(objA, objB)) return true;
    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
        return false;
    }
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || !Object.is(objA[keysA[i]], objB[keysA[i]])) {
            return false;
        }
    }
    return true;
}

// Smart equality function - uses shallow for objects, Object.is for primitives
function isEqual(a, b) {
    // For primitives, use Object.is
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
        return Object.is(a, b);
    }
    // For objects/arrays, use shallow equality
    return shallowEqual(a, b);
}

// Notify all subscribers
function notify() {
    subscribers.forEach(cb => cb());
}

// Update state and notify
function setState(updates) {
    // Merge updates, preserving refs object reference
    if (updates.refs) {
        Object.assign(storeState.refs, updates.refs);
        delete updates.refs;
    }
    storeState = { ...storeState, ...updates };
    notify();
}

// Get current state (internal)
function getInternalState() {
    return storeState;
}

// Store actions
export const storeActions = {
    // Helper: Get current config for vibration
    getCurrentConfig() {
        const state = getInternalState();
        return vibrationController.getCurrentConfig(
            {
                lengthSliderRef: { current: state.refs.lengthSlider },
                intensitySliderRef: { current: state.refs.intensitySlider },
                pauseSliderRef: { current: state.refs.pauseSlider },
                repeatCountInputRef: { current: state.refs.repeatCountInput }
            },
            {
                lengthValue: state.lengthValue,
                intensityValue: state.intensityValue,
                pauseValue: state.pauseValue,
                repeatMode: state.repeatMode,
                repeatCount: state.repeatCount
            }
        );
    },
    
    // Helper: Start rumble
    async startRumble(config) {
        const state = getInternalState();
        await vibrationController.startRumble(
            state.refs.joyCon,
            config,
            state.refs.currentRumbleAbortController,
            state.refs.currentRumblePromise,
            (status) => setState({ status })
        );
    },
    
    // Helper: Apply live config
    async applyLiveConfig() {
        const state = getState();
        await vibrationController.applyLiveConfig(
            state.refs.joyCon,
            state.refs.currentRumbleAbortController,
            storeActions.getCurrentConfig,
            storeActions.startRumble
        );
    },
    
    // Connection actions
    async connectLeft() {
        const state = getInternalState();
        if (!state.refs.joyCon) {
            state.refs.joyCon = new JoyCon(storeActions.handleStateChange);
        }
        
        try {
            const devices = state.refs.joyCon.devices;
            await (devices.left ? state.refs.joyCon.disconnectLeft() : state.refs.joyCon.connectLeft());
        } catch (error) {
            storeActions.updateUI(storeActions.getCurrentState(), `Error: ${error.message}`);
        }
    },
    
    async connectRight() {
        const state = getInternalState();
        if (!state.refs.joyCon) {
            state.refs.joyCon = new JoyCon(storeActions.handleStateChange);
        }
        
        try {
            const devices = state.refs.joyCon.devices;
            await (devices.right ? state.refs.joyCon.disconnectRight() : state.refs.joyCon.connectRight());
        } catch (error) {
            storeActions.updateUI(storeActions.getCurrentState(), `Error: ${error.message}`);
        }
    },
    
    async vibrate() {
        const state = getInternalState();
        if (state.refs.joyCon?.isVibrating) {
            if (state.refs.currentRumbleAbortController.current) {
                state.refs.currentRumbleAbortController.current.abort();
                state.refs.currentRumbleAbortController.current = null;
            }
            if (state.refs.joyCon) {
                state.refs.joyCon.stop();
            }
        } else {
            const config = storeActions.getCurrentConfig();
            await storeActions.startRumble(config);
        }
    },
    
    // Vibration setters
    setLengthValue(val) {
        setState({ lengthValue: val });
        const state = getInternalState();
        if (!state.refs.isApplyingPreset.current) {
            storeActions.handleManualPresetOverride();
        }
        storeActions.applyLiveConfig();
    },
    
    setIntensityValue(val) {
        setState({ intensityValue: val });
        const state = getInternalState();
        if (!state.refs.isApplyingPreset.current) {
            storeActions.handleManualPresetOverride();
        }
        storeActions.applyLiveConfig();
    },
    
    setPauseValue(val) {
        setState({ pauseValue: val });
        const state = getInternalState();
        if (!state.refs.isApplyingPreset.current) {
            storeActions.handleManualPresetOverride();
        }
        storeActions.applyLiveConfig();
    },
    
    setRepeatMode(val) {
        setState({ repeatMode: val, showRepeatCount: val === 'count' });
        storeActions.applyLiveConfig();
    },
    
    setRepeatCount(val) {
        setState({ repeatCount: val, repeatCountDisplay: val });
        storeActions.applyLiveConfig();
    },
    
    setRepeatCountDisplay(val) {
        setState({ repeatCountDisplay: val });
    },
    
    setShowRepeatCount(val) {
        setState({ showRepeatCount: val });
    },
    
    // Preset actions
    applyPreset(presetId, { persist = true } = {}) {
        const preset = presetManager.findPreset(presetId);
        const state = getInternalState();
        
        if (!preset) {
            state.refs.activePresetId.current = presetManager.CUSTOM_PRESET_ID;
            setState({ 
                selectedPreset: presetManager.CUSTOM_PRESET_ID,
                presetActive: false 
            });
            if (persist) {
                presetManager.persistPresetSelection(presetManager.CUSTOM_PRESET_ID);
            }
            return;
        }
        
        state.refs.isApplyingPreset.current = true;
        state.refs.activePresetId.current = presetId;
        
        // Update all values at once
        setState({
            selectedPreset: presetId,
            presetActive: true,
            lengthValue: preset.values.duration,
            intensityValue: preset.values.amplitude,
            pauseValue: preset.values.pauseDuration,
            repeatMode: preset.values.repeatMode ?? state.repeatMode,
            repeatCount: preset.values.repeatCount ?? state.repeatCount,
            repeatCountDisplay: preset.values.repeatCount ?? state.repeatCount,
            showRepeatCount: preset.values.repeatMode === 'count'
        });
        
        // Update DOM refs
        if (state.refs.lengthSlider) state.refs.lengthSlider.value = preset.values.duration;
        if (state.refs.intensitySlider) state.refs.intensitySlider.value = preset.values.amplitude;
        if (state.refs.pauseSlider) state.refs.pauseSlider.value = preset.values.pauseDuration;
        if (preset.values.repeatCount !== undefined && state.refs.repeatCountInput) {
            state.refs.repeatCountInput.value = preset.values.repeatCount;
        }
        
        state.refs.isApplyingPreset.current = false;
        
        if (persist) {
            presetManager.persistPresetSelection(presetId);
        }
        
        storeActions.applyLiveConfig();
    },
    
    handleManualPresetOverride() {
        const state = getInternalState();
        if (state.refs.activePresetId.current === presetManager.CUSTOM_PRESET_ID) {
            return;
        }
        state.refs.activePresetId.current = presetManager.CUSTOM_PRESET_ID;
        setState({
            selectedPreset: presetManager.CUSTOM_PRESET_ID,
            presetActive: false
        });
        presetManager.persistPresetSelection(presetManager.CUSTOM_PRESET_ID);
    },
    
    setPresetActive(val) {
        setState({ presetActive: val });
    },
    
    // UI helpers
    updateUI(state, error = null) {
        if (error) {
            setState({ status: { text: error, className: 'error' } });
        } else {
            const devices = state.devices || { left: false, right: false };
            const leftConnected = devices.left;
            const rightConnected = devices.right;
            
            if (!leftConnected && !rightConnected) {
                setState({ status: { text: 'no joy-con connected', className: 'disconnected' } });
            } else if (!leftConnected) {
                setState({ status: { text: 'left joy-con not connected', className: 'disconnected' } });
            } else if (!rightConnected) {
                setState({ status: { text: 'right joy-con not connected', className: 'disconnected' } });
            } else {
                setState({ status: { text: 'Connected', className: 'connected' } });
            }
        }
    },
    
    handleStateChange(state) {
        setState({
            leftConnected: state.devices.left,
            rightConnected: state.devices.right,
            isVibrating: state.vibrating
        });
        
        const currentState = getInternalState();
        if (state.vibrating && state.remainingCount !== null && currentState.repeatMode === 'count') {
            setState({ repeatCountDisplay: state.remainingCount });
        } else if (!state.vibrating && currentState.repeatMode === 'count') {
            const display = parseInt(currentState.refs.repeatCountInput?.value || currentState.repeatCount, 10);
            setState({ repeatCountDisplay: display });
        }
        
        if (state.vibratingSide === 'left') {
            setState({ leftVibrating: true, rightVibrating: false });
        } else if (state.vibratingSide === 'right') {
            setState({ leftVibrating: false, rightVibrating: true });
        } else {
            setState({ leftVibrating: false, rightVibrating: false });
        }
        
        storeActions.updateUI(state);
    },
    
    getCurrentState() {
        const state = getInternalState();
        return state.refs.joyCon ? {
            connected: state.refs.joyCon.isConnected,
            vibrating: state.refs.joyCon.isVibrating,
            deviceName: state.refs.joyCon.deviceName,
            devices: state.refs.joyCon.devices,
            vibratingSide: null,
            remainingCount: null
        } : {
            connected: false,
            vibrating: false,
            deviceName: 'Joy-Con',
            devices: { left: false, right: false },
            vibratingSide: null,
            remainingCount: null
        };
    },
    
    // Initialize
    initialize() {
        setState({ presetOptions: presetManager.populatePresetOptions() });
        const storedPresetId = presetManager.loadStoredPreset();
        if (storedPresetId && presetManager.findPreset(storedPresetId)) {
            storeActions.applyPreset(storedPresetId, { persist: false });
        } else {
            setState({
                selectedPreset: presetManager.CUSTOM_PRESET_ID,
                presetActive: false
            });
        }
        
        storeActions.updateUI({ connected: false, vibrating: false, deviceName: 'Joy-Con', devices: { left: false, right: false }, vibratingSide: null });
        
        if (!navigator.hid) {
            setState({ status: { text: 'WebHID not supported. Use Chrome/Edge 89+', className: 'error' } });
        } else {
            navigator.hid.addEventListener('disconnect', (event) => {
                const state = getInternalState();
                if (state.refs.joyCon) {
                    state.refs.joyCon.handleDisconnect(event.device);
                }
            });
        }
    }
};

// Hook to use store with selector
// Supports optional custom equality function
export function useStore(selector, equalityFn = isEqual) {
    const [, forceUpdate] = useState({});
    const selectorRef = useRef(selector);
    const equalityFnRef = useRef(equalityFn);
    
    // Initialize valueRef with the initial value immediately
    // If selector fails, return undefined (component should handle this)
    let initialValue;
    try {
        initialValue = selector(getState());
    } catch (error) {
        console.error('Store selector error during initialization:', error);
        initialValue = undefined;
    }
    const valueRef = useRef(initialValue);
    
    selectorRef.current = selector;
    equalityFnRef.current = equalityFn;
    
    useEffect(() => {
        function checkForUpdates() {
            try {
                const newValue = selectorRef.current(getState());
                // Use smart equality: shallow for objects, Object.is for primitives
                // This prevents unnecessary re-renders when selecting objects
                if (!equalityFnRef.current(valueRef.current, newValue)) {
                    valueRef.current = newValue;
                    forceUpdate({});
                }
            } catch (error) {
                // Handle selector errors gracefully
                console.error('Store selector error:', error);
            }
        }
        
        // Update initial value in case selector changed
        try {
            valueRef.current = selectorRef.current(getState());
        } catch (error) {
            console.error('Store selector error:', error);
        }
        
        // Subscribe to updates
        subscribers.add(checkForUpdates);
        
        return () => {
            subscribers.delete(checkForUpdates);
        };
    }, []);
    
    return valueRef.current;
}

// Create store state with actions attached
function createStoreState() {
    return {
        ...storeState,
        // Actions
        setLengthValue: storeActions.setLengthValue,
        setIntensityValue: storeActions.setIntensityValue,
        setPauseValue: storeActions.setPauseValue,
        setRepeatMode: storeActions.setRepeatMode,
        setRepeatCount: storeActions.setRepeatCount,
        setRepeatCountDisplay: storeActions.setRepeatCountDisplay,
        setShowRepeatCount: storeActions.setShowRepeatCount,
        setPresetActive: storeActions.setPresetActive,
        applyPreset: storeActions.applyPreset,
        handleManualPresetOverride: storeActions.handleManualPresetOverride,
        applyLiveConfig: storeActions.applyLiveConfig,
        connectLeft: storeActions.connectLeft,
        connectRight: storeActions.connectRight,
        vibrate: storeActions.vibrate,
        initialize: storeActions.initialize
    };
}

// Public getState that returns state with actions
export function getState() {
    return createStoreState();
}
