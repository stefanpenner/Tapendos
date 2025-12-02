/**
 * Main App component
 */

import { useState, useEffect, useRef } from 'preact/hooks';
import { JoyCon } from './joycon.mjs';
import * as presetManager from './preset-manager.mjs';
import * as vibration from './vibration-controller.mjs';

export function createApp(html) {
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

        const getCurrentConfig = () => vibration.getCurrentConfig(refs, state);

        const startRumbleFn = async (config) => {
            await vibration.startRumble(
                joyConRef.current,
                config,
                currentRumbleAbortControllerRef,
                currentRumblePromiseRef,
                setStatus
            );
        };

        const applyLiveConfig = async () => {
            await vibration.applyLiveConfig(
                joyConRef.current,
                currentRumbleAbortControllerRef,
                getCurrentConfig,
                startRumbleFn
            );
        };

        const applyPreset = (presetId, { persist = true } = {}) => {
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
        };

        const handleManualPresetOverride = () => {
            if (activePresetIdRef.current === presetManager.CUSTOM_PRESET_ID) {
                return;
            }

            activePresetIdRef.current = presetManager.CUSTOM_PRESET_ID;
            setSelectedPreset(presetManager.CUSTOM_PRESET_ID);
            setPresetActive(false);
            presetManager.persistPresetSelection(presetManager.CUSTOM_PRESET_ID);
        };

        const updateUI = (state, error = null) => {
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
        };

        const handleStateChange = (state) => {
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
        };

        const getCurrentState = () => {
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
        };

        const handleConnectLeft = async () => {
            if (!joyConRef.current) {
                joyConRef.current = new JoyCon(handleStateChange);
            }

            try {
                const state = joyConRef.current.devices;
                await (state.left ? joyConRef.current.disconnectLeft() : joyConRef.current.connectLeft());
            } catch (error) {
                updateUI(getCurrentState(), `Error: ${error.message}`);
            }
        };

        const handleConnectRight = async () => {
            if (!joyConRef.current) {
                joyConRef.current = new JoyCon(handleStateChange);
            }

            try {
                const state = joyConRef.current.devices;
                await (state.right ? joyConRef.current.disconnectRight() : joyConRef.current.connectRight());
            } catch (error) {
                updateUI(getCurrentState(), `Error: ${error.message}`);
            }
        };

        const handleVibrate = async () => {
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
        };

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

        return html`
            <div class="container">
                <h1>🎮 Tapendos</h1>
                <p class="subtitle">
                    Alternating Joy-Con vibration for 
                    <a href="https://en.wikipedia.org/wiki/Eye_movement_desensitization_and_reprocessing" 
                       target="_blank" 
                       rel="noopener noreferrer">EMDR</a>
                </p>
                
                <div id="status" class="status ${status.className}">
                    ${status.text}
                </div>

                <div class="controls">
                    <div class="control-group preset-select-group">
                        <label for="presetSelect">Presets</label>
                        <select 
                            id="presetSelect" 
                            ref=${presetSelectRef}
                            class=${presetActive ? 'preset-active' : ''}
                            value=${selectedPreset}
                            onChange=${(e) => {
                                const selectedId = e.target.value;
                                if (selectedId === presetManager.CUSTOM_PRESET_ID) {
                                    activePresetIdRef.current = presetManager.CUSTOM_PRESET_ID;
                                    setPresetActive(false);
                                    presetManager.persistPresetSelection(presetManager.CUSTOM_PRESET_ID);
                                } else {
                                    applyPreset(selectedId);
                                }
                            }}
                        >
                            ${presetOptions.map(opt => html`
                                <option value=${opt.value}>${opt.text}</option>
                            `)}
                        </select>
                    </div>
                    <div class="control-group">
                        <label for="lengthSlider">
                            Pulse Length: <span id="lengthValue">${lengthValue}</span>ms
                        </label>
                        <input 
                            type="range" 
                            id="lengthSlider" 
                            ref=${lengthSliderRef}
                            min="10" 
                            max="2000" 
                            value=${lengthValue} 
                            step="10"
                            onInput=${(e) => {
                                const val = e.target.value;
                                setLengthValue(val);
                                if (!isApplyingPresetRef.current) {
                                    handleManualPresetOverride();
                                }
                                applyLiveConfig();
                            }}
                        />
                    </div>

                    <div class="control-group">
                        <label for="intensitySlider">
                            Intensity: <span id="intensityValue">${vibration.formatAmplitudeDisplay(intensityValue)}</span>
                        </label>
                        <input 
                            type="range" 
                            id="intensitySlider" 
                            ref=${intensitySliderRef}
                            min="0" 
                            max="1" 
                            value=${intensityValue} 
                            step="0.05"
                            onInput=${(e) => {
                                const val = parseFloat(e.target.value);
                                setIntensityValue(val);
                                if (!isApplyingPresetRef.current) {
                                    handleManualPresetOverride();
                                }
                                applyLiveConfig();
                            }}
                        />
                    </div>

                    <div class="control-group">
                        <label for="pauseSlider">
                            Pause: <span id="pauseValue">${pauseValue}</span>ms
                        </label>
                        <input 
                            type="range" 
                            id="pauseSlider" 
                            ref=${pauseSliderRef}
                            min="0" 
                            max="3000" 
                            value=${pauseValue} 
                            step="50"
                            onInput=${(e) => {
                                const val = e.target.value;
                                setPauseValue(val);
                                if (!isApplyingPresetRef.current) {
                                    handleManualPresetOverride();
                                }
                                applyLiveConfig();
                            }}
                        />
                    </div>

                    <div class="control-group repeat-mode-group">
                        <div class="repeat-mode-wrapper">
                            <label for="repeatModeSelect">Repeat Mode:</label>
                            <select 
                                id="repeatModeSelect"
                                value=${repeatMode}
                                onChange=${(e) => {
                                    const val = e.target.value;
                                    setRepeatMode(val);
                                    setShowRepeatCount(val === 'count');
                                    applyLiveConfig();
                                }}
                            >
                                <option value="unlimited">Unlimited</option>
                                <option value="count">Count</option>
                            </select>
                        </div>
                        <div 
                            id="repeatCountGroup" 
                            class="repeat-count-wrapper" 
                            style=${showRepeatCount ? 'display: block;' : 'display: none;'}
                        >
                            <label for="repeatCountInput">
                                Repeat Count: <span id="repeatCountValue">${repeatCountDisplay}</span>
                            </label>
                            <input 
                                type="number" 
                                id="repeatCountInput" 
                                ref=${repeatCountInputRef}
                                min="1" 
                                value=${repeatCount} 
                                step="1"
                                onInput=${(e) => {
                                    let value = parseInt(e.target.value, 10);
                                    if (isNaN(value) || value < 1) {
                                        value = 1;
                                    }
                                    setRepeatCount(value);
                                    setRepeatCountDisplay(value);
                                    e.target.value = value;
                                    applyLiveConfig();
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div class="button-group">
                    <div class="connect-buttons-row">
                        <button 
                            class="connect-btn ${leftConnected ? 'connected' : ''}"
                            disabled=${isVibrating}
                            onClick=${handleConnectLeft}
                        >
                            <span class="status-indicator ${leftConnected ? 'connected' : ''} ${leftVibrating ? 'vibrating' : ''}"></span>
                            <span class="button-label">${leftConnected ? 'Left' : 'Connect Left'}</span>
                        </button>
                        <button 
                            class="connect-btn ${rightConnected ? 'connected' : ''}"
                            disabled=${isVibrating}
                            onClick=${handleConnectRight}
                        >
                            <span class="status-indicator ${rightConnected ? 'connected' : ''} ${rightVibrating ? 'vibrating' : ''}"></span>
                            <span class="button-label">${rightConnected ? 'Right' : 'Connect Right'}</span>
                        </button>
                    </div>
                    <button 
                        id="vibrateBtn" 
                        class=${isVibrating ? 'stop-btn' : 'vibrate-btn'} 
                        disabled=${!(leftConnected && rightConnected)}
                        onClick=${handleVibrate}
                    >
                        ${isVibrating ? 'Stop' : 'Vibrate'}
                    </button>
                </div>

                <div class="info">
                    <strong>Note:</strong> Before connecting, make sure your Joy-Cons are paired with your computer via Bluetooth:
                    <ul class="pairing-list">
                        <li>
                            <strong>macOS:</strong> 
                            <a href="https://support.apple.com/guide/games/connect-a-game-controller-devf8cec167c/mac" 
                               target="_blank" 
                               rel="noopener noreferrer">Pairing instructions</a> 
                            — Hold the sync button on your Joy-Con until lights flash, then select it in System Settings > Bluetooth
                        </li>
                        <li>
                            <strong>Windows:</strong> 
                            <a href="https://www.tomsguide.com/us/use-joy-cons-on-pc-mac,news-25419.html" 
                               target="_blank" 
                               rel="noopener noreferrer">Pairing instructions</a> 
                            — Hold the sync button, then add via Settings > Devices > Bluetooth
                        </li>
                        <li>
                            <strong>iOS:</strong> Joy-Cons are not compatible with iOS devices. This app requires WebHID support (Chrome/Edge 89+ on desktop)
                        </li>
                    </ul>
                </div>
            </div>
        `;
    };
}

