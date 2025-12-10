/**
 * Main App component
 */

import { useEffect } from 'preact/hooks';
import { useApp } from './hooks/useApp.mjs';
import * as presetManager from './preset-manager.mjs';
import { refs } from './refs.mjs';
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
        const [state, send] = useApp();
        
        useEffect(() => {
            // Initialize presets
            const presetOptions = presetManager.populatePresetOptions();
            send({ type: 'loadPresets', presetOptions });
            
            const storedPresetId = presetManager.loadStoredPreset();
            if (storedPresetId && presetManager.findPreset(storedPresetId)) {
                send({ type: 'applyPreset', presetId: storedPresetId, persist: false });
            }
            
            // Set initial connection state
            if (!navigator.hid) {
                send({ type: 'error', error: 'WebHID not supported. Use Chrome/Edge 89+' });
            } else {
                send({ type: 'disconnectAll' });
                navigator.hid.addEventListener('disconnect', (event) => {
                    if (refs.joyCon) {
                        refs.joyCon.handleDisconnect(event.device);
                    }
                });
            }
        }, []);
        
        return html`
            <div class="container">
                <${Header} />
                <${StatusDisplay} />
                <${Controls} />
                <${ButtonGroup} />
                <${InfoSection} />
            </div>
        `;
    };
}