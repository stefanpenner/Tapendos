/**
 * Button group component - connect buttons and vibrate button
 */

import { useConnection } from '../context.mjs';

export function createButtonGroup(html) {
    return function ButtonGroup() {
        const conn = useConnection();

        return html`
        <div class="button-group">
            <div class="connect-buttons-row">
                <button 
                    class="connect-btn ${conn.leftConnected ? 'connected' : ''}"
                    disabled=${conn.isVibrating}
                    onClick=${conn.connectLeft}
                >
                    <span class="status-indicator ${conn.leftConnected ? 'connected' : ''} ${conn.leftVibrating ? 'vibrating' : ''}"></span>
                    <span class="button-label">${conn.leftConnected ? 'Left' : 'Connect Left'}</span>
                </button>
                <button 
                    class="connect-btn ${conn.rightConnected ? 'connected' : ''}"
                    disabled=${conn.isVibrating}
                    onClick=${conn.connectRight}
                >
                    <span class="status-indicator ${conn.rightConnected ? 'connected' : ''} ${conn.rightVibrating ? 'vibrating' : ''}"></span>
                    <span class="button-label">${conn.rightConnected ? 'Right' : 'Connect Right'}</span>
                </button>
            </div>
            <button 
                id="vibrateBtn" 
                class=${conn.isVibrating ? 'stop-btn' : 'vibrate-btn'} 
                disabled=${!(conn.leftConnected && conn.rightConnected)}
                onClick=${conn.vibrate}
            >
                ${conn.isVibrating ? 'Stop' : 'Vibrate'}
            </button>
        </div>
    `;
    };
}

