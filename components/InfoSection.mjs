/**
 * Info section component
 */

import { useState } from 'preact/hooks';

export function createInfoSection(html) {
    return function InfoSection(props) {
        const [isExpanded, setIsExpanded] = useState(false);
        
        return html`
        <div class="info">
            <button 
                class="info-toggle"
                onClick=${() => setIsExpanded(!isExpanded)}
                aria-expanded=${isExpanded}
            >
                ${isExpanded ? '▼' : '▶'} Need help connecting your Joy-Cons?
            </button>
            ${isExpanded ? html`
                <div class="info-content">
            <ul class="pairing-list">
                <li>
                            <strong>macOS:</strong> Sync button → System Settings > Bluetooth
                </li>
                <li>
                            <strong>Windows:</strong> Sync button → Settings > Devices > Bluetooth
                </li>
                <li>
                            <strong>iOS:</strong> Not supported
                </li>
            </ul>
                </div>
            ` : null}
        </div>
    `;
    };
}

