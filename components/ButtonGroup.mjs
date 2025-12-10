/**
 * Button group component - connect buttons and vibrate button
 */

import { useApp, getConnectionState, getVibrationState } from '../hooks/useApp.mjs';

export function createButtonGroup(html) {
    return function ButtonGroup() {
        const [state, send] = useApp();
        const connection = getConnectionState(state);
        const vibration = getVibrationState(state);
        
        const leftConnected = connection.leftConnected;
        const rightConnected = connection.rightConnected;
        const leftVibrating = vibration.leftVibrating;
        const rightVibrating = vibration.rightVibrating;
        const isVibrating = vibration.isVibrating;
        
        const connectLeft = () => send({ type: 'connectLeftAction' });
        const connectRight = () => send({ type: 'connectRightAction' });
        const vibrate = () => {
            if (isVibrating) {
                send({ type: 'stopVibration' });
            } else {
                send({ type: 'startVibration' });
            }
        };

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
                class=${isVibrating ? 'stop-btn' : leftConnected && rightConnected ? 'vibrate-btn ready' : 'vibrate-btn'} 
                disabled=${!(leftConnected && rightConnected)}
                onClick=${vibrate}
            >
                ${isVibrating ? 'Stop' : 'Vibrate'}
            </button>
        </div>
    `;
    };
}

