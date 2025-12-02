/**
 * Status display component
 */

import { useStatus } from '../context.mjs';

export function createStatusDisplay(html) {
    return function StatusDisplay() {
        const status = useStatus();
        return html`
            <div id="status" class="status ${status.className}">
                ${status.text}
            </div>
        `;
    };
}

