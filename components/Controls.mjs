/**
 * Controls component - presets, sliders, and repeat mode
 */

import * as vibration from '../vibration-controller.mjs';
import * as presetManager from '../preset-manager.mjs';
import { useStore } from '../store.mjs';

export function createControls(html) {
    return function Controls() {
        const lengthValue = useStore(state => state.lengthValue);
        const intensityValue = useStore(state => state.intensityValue);
        const pauseValue = useStore(state => state.pauseValue);
        const repeatMode = useStore(state => state.repeatMode);
        const repeatCount = useStore(state => state.repeatCount);
        const repeatCountDisplay = useStore(state => state.repeatCountDisplay);
        const showRepeatCount = useStore(state => state.showRepeatCount);
        const presetOptions = useStore(state => state.presetOptions);
        const selectedPreset = useStore(state => state.selectedPreset);
        const presetActive = useStore(state => state.presetActive);
        const refs = useStore(state => state.refs);
        const setLengthValue = useStore(state => state.setLengthValue);
        const setIntensityValue = useStore(state => state.setIntensityValue);
        const setPauseValue = useStore(state => state.setPauseValue);
        const setRepeatMode = useStore(state => state.setRepeatMode);
        const setShowRepeatCount = useStore(state => state.setShowRepeatCount);
        const setRepeatCount = useStore(state => state.setRepeatCount);
        const setRepeatCountDisplay = useStore(state => state.setRepeatCountDisplay);
        const setPresetActive = useStore(state => state.setPresetActive);
        const applyPreset = useStore(state => state.applyPreset);
        const handleManualPresetOverride = useStore(state => state.handleManualPresetOverride);
        const applyLiveConfig = useStore(state => state.applyLiveConfig);

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
                    ref=${(el) => { if (el) refs.lengthSlider = el; }}
                    min="10" 
                    max="2000" 
                    value=${lengthValue} 
                    step="10"
                    onInput=${(e) => {
                        const val = e.target.value;
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
                        const val = e.target.value;
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
    `;
    };
}

