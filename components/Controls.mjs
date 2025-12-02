/**
 * Controls component - presets, sliders, and repeat mode
 */

import * as vibration from '../vibration-controller.mjs';
import * as presetManager from '../preset-manager.mjs';
import { useVibration, usePresets, useRefs } from '../context.mjs';

export function createControls(html) {
    return function Controls() {
        const vib = useVibration();
        const presets = usePresets();
        const refs = useRefs();

    return html`
        <div class="controls">
            <div class="control-group preset-select-group">
                <label for="presetSelect">Presets</label>
                <select 
                    id="presetSelect" 
                    ref=${refs.presetSelect}
                    class=${presets.active ? 'preset-active' : ''}
                    value=${presets.selected}
                    onChange=${(e) => {
                        const selectedId = e.target.value;
                        if (selectedId === presetManager.CUSTOM_PRESET_ID) {
                            refs.activePresetId.current = presetManager.CUSTOM_PRESET_ID;
                            presets.setActive(false);
                            presetManager.persistPresetSelection(presetManager.CUSTOM_PRESET_ID);
                        } else {
                            presets.apply(selectedId);
                        }
                    }}
                >
                    ${presets.options.map(opt => html`
                        <option value=${opt.value}>${opt.text}</option>
                    `)}
                </select>
            </div>
            <div class="control-group">
                <label for="lengthSlider">
                    Pulse Length: <span id="lengthValue">${vib.lengthValue}</span>ms
                </label>
                <input 
                    type="range" 
                    id="lengthSlider" 
                    ref=${refs.lengthSlider}
                    min="10" 
                    max="2000" 
                    value=${vib.lengthValue} 
                    step="10"
                    onInput=${(e) => {
                        const val = e.target.value;
                        vib.setLengthValue(val);
                        if (!refs.isApplyingPreset.current) {
                            presets.handleManualOverride();
                        }
                        vib.applyLiveConfig();
                    }}
                />
            </div>

            <div class="control-group">
                <label for="intensitySlider">
                    Intensity: <span id="intensityValue">${vibration.formatAmplitudeDisplay(vib.intensityValue)}</span>
                </label>
                <input 
                    type="range" 
                    id="intensitySlider" 
                    ref=${refs.intensitySlider}
                    min="0" 
                    max="1" 
                    value=${vib.intensityValue} 
                    step="0.05"
                    onInput=${(e) => {
                        const val = parseFloat(e.target.value);
                        vib.setIntensityValue(val);
                        if (!refs.isApplyingPreset.current) {
                            presets.handleManualOverride();
                        }
                        vib.applyLiveConfig();
                    }}
                />
            </div>

            <div class="control-group">
                <label for="pauseSlider">
                    Pause: <span id="pauseValue">${vib.pauseValue}</span>ms
                </label>
                <input 
                    type="range" 
                    id="pauseSlider" 
                    ref=${refs.pauseSlider}
                    min="0" 
                    max="3000" 
                    value=${vib.pauseValue} 
                    step="50"
                    onInput=${(e) => {
                        const val = e.target.value;
                        vib.setPauseValue(val);
                        if (!refs.isApplyingPreset.current) {
                            presets.handleManualOverride();
                        }
                        vib.applyLiveConfig();
                    }}
                />
            </div>

            <div class="control-group repeat-mode-group">
                <div class="repeat-mode-wrapper">
                    <label for="repeatModeSelect">Repeat Mode:</label>
                    <select 
                        id="repeatModeSelect"
                        value=${vib.repeatMode}
                        onChange=${(e) => {
                            const val = e.target.value;
                            vib.setRepeatMode(val);
                            vib.setShowRepeatCount(val === 'count');
                            vib.applyLiveConfig();
                        }}
                    >
                        <option value="unlimited">Unlimited</option>
                        <option value="count">Count</option>
                    </select>
                </div>
                <div 
                    id="repeatCountGroup" 
                    class="repeat-count-wrapper" 
                    style=${vib.showRepeatCount ? 'display: block;' : 'display: none;'}
                >
                    <label for="repeatCountInput">
                        Repeat Count: <span id="repeatCountValue">${vib.repeatCountDisplay}</span>
                    </label>
                    <input 
                        type="number" 
                        id="repeatCountInput" 
                        ref=${refs.repeatCountInput}
                        min="1" 
                        value=${vib.repeatCount} 
                        step="1"
                        onInput=${(e) => {
                            let value = parseInt(e.target.value, 10);
                            if (isNaN(value) || value < 1) {
                                value = 1;
                            }
                            vib.setRepeatCount(value);
                            vib.setRepeatCountDisplay(value);
                            e.target.value = value;
                            vib.applyLiveConfig();
                        }}
                    />
                </div>
            </div>
        </div>
    `;
    };
}

