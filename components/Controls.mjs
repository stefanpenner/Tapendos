/**
 * Controls component - presets, sliders, and repeat mode
 */

import * as vibration from '../vibration-controller.mjs';
import * as presetManager from '../preset-manager.mjs';
import { useApp, getSettings, getPresets } from '../hooks/useApp.mjs';
import { refs } from '../refs.mjs';

/**
 * Pure controls function - takes html, settings, presets, showAdvancedControls, and send function as parameters
 * Used for testing and when you want to control the component directly
 */
export function Controls({ html, settings, presets, showAdvancedControls, send }) {
    const lengthValue = settings.lengthValue;
    const intensityValue = settings.intensityValue;
    const pauseValue = settings.pauseValue;
    const repeatMode = settings.repeatMode;
    const repeatCount = settings.repeatCount;
    const repeatCountDisplay = settings.repeatCountDisplay;
    const showRepeatCount = settings.showRepeatCount;
    const presetOptions = presets.presetOptions;
    const selectedPreset = presets.selectedPreset;
    const presetActive = presets.presetActive;
    const isCustomPreset = selectedPreset === presetManager.CUSTOM_PRESET_ID;
    const shouldShowSliders = showAdvancedControls || isCustomPreset;

    const setLengthValue = (val) => send({ type: 'setLength', value: parseInt(val, 10) });
    const setIntensityValue = (val) => send({ type: 'setIntensity', value: parseFloat(val) });
    const setPauseValue = (val) => send({ type: 'setPause', value: parseInt(val, 10) });
    const setRepeatMode = (val) => send({ type: 'setRepeatMode', value: val });
    const setRepeatCount = (val) => send({ type: 'setRepeatCount', value: val });
    const setRepeatCountDisplay = (val) => send({ type: 'setRepeatCountDisplay', value: val });
    const applyPreset = (presetId) => send({ type: 'applyPreset', presetId, persist: true });
    const toggleAdvanced = () => send({ type: 'toggleAdvancedControls' });

    return html`
        <div class="controls">
            <div class="control-group preset-select-group">
                <label for="presetSelect">Presets</label>
                <select 
                    id="presetSelect" 
                    ref=${(el) => { if (el) refs.presetSelect = el; }}
                    class=${presetActive ? 'preset-active' : ''}
                    value=${selectedPreset}
                    onChange=${(e) => {
                        const selectedId = e.target.value;
                        if (selectedId === presetManager.CUSTOM_PRESET_ID) {
                            refs.activePresetId.current = presetManager.CUSTOM_PRESET_ID;
                            send({ type: 'setPresetActive', value: false });
                            presetManager.persistPresetSelection(presetManager.CUSTOM_PRESET_ID);
                            send({ type: 'manualOverride' });
                            if (!showAdvancedControls) {
                                send({ type: 'toggleAdvancedControls' });
                            }
                        } else {
                            applyPreset(selectedId);
                        }
                    }}
                >
                    ${presetOptions && presetOptions.length > 0 ? presetOptions.map(opt => html`
                        <option value=${opt.value}>${opt.text}</option>
                    `) : html`
                        <option value=${presetManager.CUSTOM_PRESET_ID}>Custom</option>
                    `}
                </select>
            </div>
            ${!isCustomPreset ? html`
                <button 
                    type="button"
                    class="toggle-advanced-btn"
                    onClick=${toggleAdvanced}
                >
                    ${showAdvancedControls ? '▼' : '▶'} ${showAdvancedControls ? 'Hide' : 'Show'} Advanced Settings
                </button>
            ` : ''}
            <div class="advanced-controls" style=${shouldShowSliders ? 'display: block;' : 'display: none;'}>
            <div class="control-group">
                <label for="lengthSlider">
                    Pulse Length: <span id="lengthValue">${lengthValue}</span>ms
                </label>
                <input 
                    type="range" 
                    id="lengthSlider" 
                    ref=${(el) => { if (el) refs.lengthSlider = el; }}
                    min="10" 
                    max="2000" 
                    value=${lengthValue} 
                    step="10"
                    onInput=${(e) => {
                        const val = parseInt(e.target.value, 10);
                        setLengthValue(val);
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
                    ref=${(el) => { if (el) refs.intensitySlider = el; }}
                    min="0" 
                    max="1" 
                    value=${intensityValue} 
                    step="0.05"
                    onInput=${(e) => {
                        const val = parseFloat(e.target.value);
                        setIntensityValue(val);
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
                    ref=${(el) => { if (el) refs.pauseSlider = el; }}
                    min="0" 
                    max="3000" 
                    value=${pauseValue} 
                    step="50"
                    onInput=${(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPauseValue(val);
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
                        ref=${(el) => { if (el) refs.repeatCountInput = el; }}
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
                        }}
                    />
                </div>
            </div>
            </div>
        </div>
    `;
}

/**
 * Hook-based controls component - uses useApp to get state from state machine
 * Used in production
 */
export function createControls(html) {
    return function ControlsHook() {
        const [state, send] = useApp();
        const settings = getSettings(state);
        const presets = getPresets(state);
        const showAdvancedControls = state.context?.showAdvancedControls ?? false;
        return Controls({ html, settings, presets, showAdvancedControls, send });
    };
}

