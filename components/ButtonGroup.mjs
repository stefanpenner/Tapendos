/**
 * Button group component - connect buttons and vibrate button
 */

import { useApp, getConnectionState, getVibrationState } from '../hooks/useApp.mjs';

/**
 * Pure button group function - takes html, connection state, vibration state, and send function as parameters
 * Used for testing and when you want to control the component directly
 */
export function ButtonGroup({ html, connection, vibration, send }) {
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
        <div class="controller-buttons-container">
            <button
                class="connect-btn connect-btn-left${leftConnected ? ' connected' : ''}"
                disabled=${isVibrating}
                onClick=${connectLeft}
            >
                <span class="status-indicator${leftConnected ? ' connected' : ''}${leftVibrating ? ' vibrating' : ''}"></span>
                <span class="button-label">${leftConnected ? 'Left' : 'Connect Left'}</span>
            </button>
            <button
                id="vibrateBtn"
                class=${isVibrating ? 'stop-btn' : leftConnected && rightConnected ? 'vibrate-btn ready' : 'vibrate-btn'}
                disabled=${!(leftConnected && rightConnected)}
                onClick=${vibrate}
            >
                ${isVibrating ? 'Stop' : 'Vibrate'}
            </button>
            <button
                class="connect-btn connect-btn-right${rightConnected ? ' connected' : ''}"
                disabled=${isVibrating}
                onClick=${connectRight}
            >
                <span class="status-indicator${rightConnected ? ' connected' : ''}${rightVibrating ? ' vibrating' : ''}"></span>
                <span class="button-label">${rightConnected ? 'Right' : 'Connect Right'}</span>
            </button>
        </div>
    </div>
`;
}

/**
 * Hook-based button group component - uses useApp to get state from state machine
 * Used in production
 */
export function createButtonGroup(html) {
    return function ButtonGroupHook() {
        const [state, send] = useApp();
        const connection = getConnectionState(state);
        const vibration = getVibrationState(state);
        return ButtonGroup({ html, connection, vibration, send });
    };
}

