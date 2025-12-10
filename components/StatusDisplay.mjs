/**
 * Status display component
 */

import { useApp, getStatus } from '../hooks/useApp.mjs';

export function createStatusDisplay(html) {
    return function StatusDisplay() {
        const [state] = useApp();
        const status = getStatus(state);
        return html`
            <div id="status" class="status ${status.className || 'disconnected'}">
                ${status.text || 'Loading...'}
            </div>
        `;
    };
}

