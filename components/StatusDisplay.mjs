/**
 * Status display component
 */

import { useStore } from '../store.mjs';

export function createStatusDisplay(html) {
    return function StatusDisplay() {
        const status = useStore(state => state.status) || { text: 'Loading...', className: 'disconnected' };
        return html`
            <div id="status" class="status ${status.className || 'disconnected'}">
                ${status.text || 'Loading...'}
            </div>
        `;
    };
}

