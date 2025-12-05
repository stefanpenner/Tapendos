/**
 * Main App component
 */

import { useEffect } from 'preact/hooks';
import { useStore } from './store.mjs';
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
        const initialize = useStore(state => state.initialize);
        
        useEffect(() => {
            initialize();
        }, [initialize]);
        
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