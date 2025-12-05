/**
 * Button group component - connect buttons and vibrate button
 */

import { useStore } from '../store.mjs';

export function createButtonGroup(html) {
    return function ButtonGroup() {
        const leftConnected = useStore(state => state.leftConnected);
        const rightConnected = useStore(state => state.rightConnected);
        const leftVibrating = useStore(state => state.leftVibrating);
        const rightVibrating = useStore(state => state.rightVibrating);
        const isVibrating = useStore(state => state.isVibrating);
        const connectLeft = useStore(state => state.connectLeft);
        const connectRight = useStore(state => state.connectRight);
        const vibrate = useStore(state => state.vibrate);

        return html`
        <div class="button-group">
            <div class="connect-buttons-row">
                <button 
                    class="connect-btn ${leftConnected ? 'connected' : ''}"
                    disabled=${isVibrating}
                    onClick=${connectLeft}
                >
                    <span class="status-indicator ${leftConnected ? 'connected' : ''} ${leftVibrating ? 'vibrating' : ''}"></span>
                    <span class="button-label">${leftConnected ? 'Left' : 'Connect Left'}</span>
                </button>
                <button 
                    class="connect-btn ${rightConnected ? 'connected' : ''}"
                    disabled=${isVibrating}
                    onClick=${connectRight}
                >
                    <span class="status-indicator ${rightConnected ? 'connected' : ''} ${rightVibrating ? 'vibrating' : ''}"></span>
                    <span class="button-label">${rightConnected ? 'Right' : 'Connect Right'}</span>
                </button>
            </div>
            <button 
                id="vibrateBtn" 
                class=${isVibrating ? 'stop-btn' : 'vibrate-btn'} 
                disabled=${!(leftConnected && rightConnected)}
                onClick=${vibrate}
            >
                ${isVibrating ? 'Stop' : 'Vibrate'}
            </button>
        </div>
    `;
    };
}

