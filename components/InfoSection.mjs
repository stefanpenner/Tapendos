/**
 * Info section component
 */

import { useState } from 'preact/hooks';

/**
 * Pure info section function - takes html, isExpanded state, and onToggle function as parameters
 * Used for testing and when you want to control the component directly
 */
export function InfoSection({ html, isExpanded, onToggle }) {
    return html`
    <div class="info">
        <button
            class="info-toggle"
            onClick=${onToggle}
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
}

/**
 * Hook-based info section component - uses useState for local state
 * Used in production
 */
export function createInfoSection(html) {
    return function InfoSectionHook(props) {
        const [isExpanded, setIsExpanded] = useState(false);
        return InfoSection({ html, isExpanded, onToggle: () => setIsExpanded(!isExpanded) });
    };
}

