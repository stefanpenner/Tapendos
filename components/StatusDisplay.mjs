/**
 * Status display component
 */

import { useApp, getStatus } from '../hooks/useApp.mjs';

/**
 * Pure status display function - takes html and status as parameters
 * Used for testing and when you want to control the status directly
 */
export function StatusDisplay({ html, status }) {
    // Handle null/undefined status by providing defaults
    const text = status?.text || 'Loading...';
    const className = status?.className || 'disconnected';

    return html`
        <div id="status" class="status ${className}">
            ${text}
        </div>
    `;
}

/**`
 * Hook-based status display component - uses useApp to get status from state machine
 * Used in production
 */
export function createStatusDisplay(html) {
    return function StatusDisplayHook() {
        const [state] = useApp();
        const status = getStatus(state);
        return StatusDisplay({ html, status });
    };
}

