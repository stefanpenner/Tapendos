/**
 * Main App component
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'preact/hooks';
import { JoyCon } from './joycon.mjs';
import * as presetManager from './preset-manager.mjs';
import * as vibrationController from './vibration-controller.mjs';
import { AppContext } from './context.mjs';
import { createHeader } from './components/Header.mjs';
import { createStatusDisplay } from './components/StatusDisplay.mjs';
import { createControls } from './components/Controls.mjs';
import { createButtonGroup } from './components/ButtonGroup.mjs';
import { createInfoSection } from './components/InfoSection.mjs';

export function createApp(html) {
    const Header = createHeader(html);
    const StatusDisplay = createStatusDisplay(html);
    const Controls = createControls(html);
    const ButtonGroup = createButtonGroup(html);
    const InfoSection = createInfoSection(html);
    return function App() {
        const [status, setStatus] = useState({ text: 'Disconnected', className: 'disconnected' });
        const [leftConnected, setLeftConnected] = useState(false);
        const [rightConnected, setRightConnected] = useState(false);
        const [leftVibrating, setLeftVibrating] = useState(false);
        const [rightVibrating, setRightVibrating] = useState(false);
        const [isVibrating, setIsVibrating] = useState(false);
        const [lengthValue, setLengthValue] = useState(500);
        const [intensityValue, setIntensityValue] = useState(0.5);
        const [pauseValue, setPauseValue] = useState(800);
        const [repeatMode, setRepeatMode] = useState('unlimited');
        const [repeatCount, setRepeatCount] = useState(1);
        const [repeatCountDisplay, setRepeatCountDisplay] = useState(1);
        const [showRepeatCount, setShowRepeatCount] = useState(false);
        const [presetOptions, setPresetOptions] = useState([]);
        const [selectedPreset, setSelectedPreset] = useState(presetManager.CUSTOM_PRESET_ID);
        const [presetActive, setPresetActive] = useState(false);

        const joyConRef = useRef(null);
        const currentRumbleAbortControllerRef = useRef(null);
        const currentRumblePromiseRef = useRef(null);
        const activePresetIdRef = useRef(presetManager.CUSTOM_PRESET_ID);
        const isApplyingPresetRef = useRef(false);
        const lengthSliderRef = useRef(null);
        const intensitySliderRef = useRef(null);
        const pauseSliderRef = useRef(null);
        const repeatCountInputRef = useRef(null);
        const presetSelectRef = useRef(null);

        const refs = {
            lengthSliderRef,
            intensitySliderRef,
            pauseSliderRef,
            repeatCountInputRef
        };

        const state = {
            lengthValue,
            intensityValue,
            pauseValue,
            repeatMode,
            repeatCount
        };

        const getCurrentConfig = useCallback(() => {
            const currentState = {
                lengthValue,
                intensityValue,
                pauseValue,
                repeatMode,
                repeatCount
            };
            return vibrationController.getCurrentConfig(refs, currentState);
        }, [lengthValue, intensityValue, pauseValue, repeatMode, repeatCount]);

        const startRumbleFn = useCallback(async (config) => {
            await vibrationController.startRumble(
                joyConRef.current,
                config,
                currentRumbleAbortControllerRef,
                currentRumblePromiseRef,
                setStatus
            );
        }, []);

        const applyLiveConfig = useCallback(async () => {
            await vibrationController.applyLiveConfig(
                joyConRef.current,
                currentRumbleAbortControllerRef,
                getCurrentConfig,
                startRumbleFn
            );
        }, [getCurrentConfig, startRumbleFn]);

        const applyPreset = useCallback((presetId, { persist = true } = {}) => {
            const preset = presetManager.findPreset(presetId);
            if (!preset) {
                activePresetIdRef.current = presetManager.CUSTOM_PRESET_ID;
                setSelectedPreset(presetManager.CUSTOM_PRESET_ID);
                setPresetActive(false);
                if (persist) {
                    presetManager.persistPresetSelection(presetManager.CUSTOM_PRESET_ID);
                }
                return;
            }

            isApplyingPresetRef.current = true;
            activePresetIdRef.current = presetId;
            setSelectedPreset(presetId);
            setPresetActive(true);

            setLengthValue(preset.values.duration);
            if (lengthSliderRef.current) lengthSliderRef.current.value = preset.values.duration;
            
            setIntensityValue(preset.values.amplitude);
            if (intensitySliderRef.current) intensitySliderRef.current.value = preset.values.amplitude;
            
            setPauseValue(preset.values.pauseDuration);
            if (pauseSliderRef.current) pauseSliderRef.current.value = preset.values.pauseDuration;
            
            if (preset.values.repeatMode !== undefined) {
                setRepeatMode(preset.values.repeatMode);
                setShowRepeatCount(preset.values.repeatMode === 'count');
            }
            if (preset.values.repeatCount !== undefined) {
                setRepeatCount(preset.values.repeatCount);
                setRepeatCountDisplay(preset.values.repeatCount);
                if (repeatCountInputRef.current) repeatCountInputRef.current.value = preset.values.repeatCount;
            }

            isApplyingPresetRef.current = false;

            if (persist) {
                presetManager.persistPresetSelection(presetId);
            }

            applyLiveConfig();
        }, [applyLiveConfig]);

        const handleManualPresetOverride = useCallback(() => {
            if (activePresetIdRef.current === presetManager.CUSTOM_PRESET_ID) {
                return;
            }

            activePresetIdRef.current = presetManager.CUSTOM_PRESET_ID;
            setSelectedPreset(presetManager.CUSTOM_PRESET_ID);
            setPresetActive(false);
            presetManager.persistPresetSelection(presetManager.CUSTOM_PRESET_ID);
        }, []);

        const updateUI = useCallback((state, error = null) => {
            if (error) {
                setStatus({ text: error, className: 'error' });
            } else if (!state.connected) {
                setStatus({ text: 'No Joy-Con connected', className: 'disconnected' });
            } else {
                const devices = state.devices || { left: false, right: false };
                const connectedCount = (devices.left ? 1 : 0) + (devices.right ? 1 : 0);
                
                if (connectedCount === 1) {
                    setStatus({ text: '1/2 Joy-Con Connected • connect both to enable vibration', className: 'connected' });
                } else if (connectedCount === 2) {
                    setStatus({ text: 'Connected', className: 'connected' });
                } else {
                    setStatus({ text: 'Connected', className: 'connected' });
                }
            }
        }, []);

        const handleStateChange = useCallback((state) => {
            setLeftConnected(state.devices.left);
            setRightConnected(state.devices.right);
            setIsVibrating(state.vibrating);
            
            if (state.vibrating && state.remainingCount !== null && repeatMode === 'count') {
                setRepeatCountDisplay(state.remainingCount);
            } else if (!state.vibrating && repeatMode === 'count') {
                setRepeatCountDisplay(parseInt(repeatCountInputRef.current?.value || repeatCount, 10));
            }

            if (state.vibratingSide === 'left') {
                setLeftVibrating(true);
                setRightVibrating(false);
            } else if (state.vibratingSide === 'right') {
                setLeftVibrating(false);
                setRightVibrating(true);
            } else {
                setLeftVibrating(false);
                setRightVibrating(false);
            }

            updateUI(state);
        }, [repeatMode, repeatCount, updateUI]);

        const getCurrentState = useCallback(() => {
            return joyConRef.current ? {
                connected: joyConRef.current.isConnected,
                vibrating: joyConRef.current.isVibrating,
                deviceName: joyConRef.current.deviceName,
                devices: joyConRef.current.devices,
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
        }, []);

        const handleConnectLeft = useCallback(async () => {
            if (!joyConRef.current) {
                joyConRef.current = new JoyCon(handleStateChange);
            }

            try {
                const state = joyConRef.current.devices;
                await (state.left ? joyConRef.current.disconnectLeft() : joyConRef.current.connectLeft());
            } catch (error) {
                updateUI(getCurrentState(), `Error: ${error.message}`);
            }
        }, [handleStateChange, updateUI, getCurrentState]);

        const handleConnectRight = useCallback(async () => {
            if (!joyConRef.current) {
                joyConRef.current = new JoyCon(handleStateChange);
            }

            try {
                const state = joyConRef.current.devices;
                await (state.right ? joyConRef.current.disconnectRight() : joyConRef.current.connectRight());
            } catch (error) {
                updateUI(getCurrentState(), `Error: ${error.message}`);
            }
        }, [handleStateChange, updateUI, getCurrentState]);

        const handleVibrate = useCallback(async () => {
            if (joyConRef.current?.isVibrating) {
                if (currentRumbleAbortControllerRef.current) {
                    currentRumbleAbortControllerRef.current.abort();
                    currentRumbleAbortControllerRef.current = null;
                }
                if (joyConRef.current) {
                    joyConRef.current.stop();
                }
            } else {
                const config = getCurrentConfig();
                await startRumbleFn(config);
            }
        }, [getCurrentConfig, startRumbleFn]);

        useEffect(() => {
            setPresetOptions(presetManager.populatePresetOptions());
            const storedPresetId = presetManager.loadStoredPreset();
            if (storedPresetId && presetManager.findPreset(storedPresetId)) {
                applyPreset(storedPresetId, { persist: false });
            } else {
                setSelectedPreset(presetManager.CUSTOM_PRESET_ID);
                setPresetActive(false);
            }
            
            updateUI({ connected: false, vibrating: false, deviceName: 'Joy-Con', devices: { left: false, right: false }, vibratingSide: null });

            if (!navigator.hid) {
                setStatus({ text: 'WebHID not supported. Use Chrome/Edge 89+', className: 'error' });
            } else {
                navigator.hid.addEventListener('disconnect', (event) => {
                    if (joyConRef.current) {
                        joyConRef.current.handleDisconnect(event.device);
                    }
                });
            }
        }, []);

        // Memoize slices so they only change when their specific values change
        const connection = useMemo(() => ({
            leftConnected,
            rightConnected,
            leftVibrating,
            rightVibrating,
            isVibrating,
            connectLeft: handleConnectLeft,
            connectRight: handleConnectRight,
            vibrate: handleVibrate
        }), [
            leftConnected,
            rightConnected,
            leftVibrating,
            rightVibrating,
            isVibrating,
            handleConnectLeft,
            handleConnectRight,
            handleVibrate
        ]);

        const vibration = useMemo(() => ({
            lengthValue,
            intensityValue,
            pauseValue,
            repeatMode,
            repeatCount,
            repeatCountDisplay,
            showRepeatCount,
            setLengthValue,
            setIntensityValue,
            setPauseValue,
            setRepeatMode,
            setShowRepeatCount,
            setRepeatCount,
            setRepeatCountDisplay,
            applyLiveConfig
        }), [
            lengthValue,
            intensityValue,
            pauseValue,
            repeatMode,
            repeatCount,
            repeatCountDisplay,
            showRepeatCount,
            setLengthValue,
            setIntensityValue,
            setPauseValue,
            setRepeatMode,
            setShowRepeatCount,
            setRepeatCount,
            setRepeatCountDisplay,
            applyLiveConfig
        ]);

        const presets = useMemo(() => ({
            options: presetOptions,
            selected: selectedPreset,
            active: presetActive,
            apply: applyPreset,
            handleManualOverride: handleManualPresetOverride,
            setActive: setPresetActive
        }), [
            presetOptions,
            selectedPreset,
            presetActive,
            applyPreset,
            handleManualPresetOverride,
            setPresetActive
        ]);

        // Refs are stable, no need to memoize
        const contextRefs = {
            presetSelect: presetSelectRef,
            activePresetId: activePresetIdRef,
            isApplyingPreset: isApplyingPresetRef,
            lengthSlider: lengthSliderRef,
            intensitySlider: intensitySliderRef,
            pauseSlider: pauseSliderRef,
            repeatCountInput: repeatCountInputRef
        };

        const contextValue = {
            status,
            connection,
            vibration,
            presets,
            refs: contextRefs
        };

        return html`
            <${AppContext.Provider} value=${contextValue}>
                <div class="container">
                    <${Header} />
                    <${StatusDisplay} />
                    <${Controls} />
                    <${ButtonGroup} />
                    <${InfoSection} />
                </div>
            </${AppContext.Provider}>
        `;
    };
}