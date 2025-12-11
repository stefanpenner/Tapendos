/**
 * Tests for ButtonGroup component
 */

import { test, expect, describe, beforeEach, mock } from 'bun:test';
import { h, render } from 'preact';
import htm from 'htm';
import { ButtonGroup } from './ButtonGroup.mjs';

// DOM environment is set up globally in setup.test.mjs

// Create real HTML template tag
const html = htm.bind(h);

// Helper to render ButtonGroup with specific state
const renderButtonGroup = (connection, vibration, send = mock(() => {})) => {
    const container = document.createElement('div');

    render(
        ButtonGroup({ html, connection, vibration, send }),
        container
    );

    return container;
};

describe('ButtonGroup', () => {
    beforeEach(() => {
        // Cleanup if needed
    });

    const scenarios = [
        // Disconnected states
        {
            name: 'both controllers disconnected',
            connection: { leftConnected: false, rightConnected: false },
            vibration: { leftVibrating: false, rightVibrating: false, isVibrating: false },
            expectedLeftButton: {
                className: 'connect-btn connect-btn-left',
                disabled: false,
                text: 'Connect Left'
            },
            expectedRightButton: {
                className: 'connect-btn connect-btn-right',
                disabled: false,
                text: 'Connect Right'
            },
            expectedVibrateButton: {
                className: 'vibrate-btn',
                disabled: true,
                text: 'Vibrate'
            }
        },
        {
            name: 'left connected, right disconnected',
            connection: { leftConnected: true, rightConnected: false },
            vibration: { leftVibrating: false, rightVibrating: false, isVibrating: false },
            expectedLeftButton: {
                className: 'connect-btn connect-btn-left connected',
                disabled: false,
                text: 'Left'
            },
            expectedRightButton: {
                className: 'connect-btn connect-btn-right',
                disabled: false,
                text: 'Connect Right'
            },
            expectedVibrateButton: {
                className: 'vibrate-btn',
                disabled: true,
                text: 'Vibrate'
            }
        },
        {
            name: 'right connected, left disconnected',
            connection: { leftConnected: false, rightConnected: true },
            vibration: { leftVibrating: false, rightVibrating: false, isVibrating: false },
            expectedLeftButton: {
                className: 'connect-btn connect-btn-left',
                disabled: false,
                text: 'Connect Left'
            },
            expectedRightButton: {
                className: 'connect-btn connect-btn-right connected',
                disabled: false,
                text: 'Right'
            },
            expectedVibrateButton: {
                className: 'vibrate-btn',
                disabled: true,
                text: 'Vibrate'
            }
        },
        {
            name: 'both controllers connected, not vibrating',
            connection: { leftConnected: true, rightConnected: true },
            vibration: { leftVibrating: false, rightVibrating: false, isVibrating: false },
            expectedLeftButton: {
                className: 'connect-btn connect-btn-left connected',
                disabled: false,
                text: 'Left'
            },
            expectedRightButton: {
                className: 'connect-btn connect-btn-right connected',
                disabled: false,
                text: 'Right'
            },
            expectedVibrateButton: {
                className: 'vibrate-btn ready',
                disabled: false,
                text: 'Vibrate'
            }
        },
        {
            name: 'both controllers connected, vibrating',
            connection: { leftConnected: true, rightConnected: true },
            vibration: { leftVibrating: true, rightVibrating: true, isVibrating: true },
            expectedLeftButton: {
                className: 'connect-btn connect-btn-left connected',
                disabled: true,
                text: 'Left'
            },
            expectedRightButton: {
                className: 'connect-btn connect-btn-right connected',
                disabled: true,
                text: 'Right'
            },
            expectedVibrateButton: {
                className: 'stop-btn',
                disabled: false,
                text: 'Stop'
            }
        },
        {
            name: 'left vibrating, right not',
            connection: { leftConnected: true, rightConnected: true },
            vibration: { leftVibrating: true, rightVibrating: false, isVibrating: true },
            expectedLeftButton: {
                className: 'connect-btn connect-btn-left connected',
                disabled: true,
                text: 'Left'
            },
            expectedRightButton: {
                className: 'connect-btn connect-btn-right connected',
                disabled: true,
                text: 'Right'
            },
            expectedVibrateButton: {
                className: 'stop-btn',
                disabled: false,
                text: 'Stop'
            }
        }
    ];

    test.each(scenarios)('renders correctly: $name', ({
        connection,
        vibration,
        expectedLeftButton,
        expectedRightButton,
        expectedVibrateButton
    }) => {
        const container = renderButtonGroup(connection, vibration);

        // Test left button
        const leftButton = container.querySelector('.connect-btn-left');
        expect(leftButton).toBeDefined();
        expect(leftButton?.className).toBe(expectedLeftButton.className);
        expect(leftButton?.disabled).toBe(expectedLeftButton.disabled);
        expect(leftButton?.textContent?.trim()).toBe(expectedLeftButton.text);

        // Test right button
        const rightButton = container.querySelector('.connect-btn-right');
        expect(rightButton).toBeDefined();
        expect(rightButton?.className).toBe(expectedRightButton.className);
        expect(rightButton?.disabled).toBe(expectedRightButton.disabled);
        expect(rightButton?.textContent?.trim()).toBe(expectedRightButton.text);

        // Test vibrate button
        const vibrateButton = container.querySelector('#vibrateBtn');
        expect(vibrateButton).toBeDefined();
        expect(vibrateButton?.className).toBe(expectedVibrateButton.className);
        expect(vibrateButton?.disabled).toBe(expectedVibrateButton.disabled);
        expect(vibrateButton?.textContent?.trim()).toBe(expectedVibrateButton.text);
    });

    test('dispatches connectLeftAction when left connect button is clicked', () => {
        const send = mock(() => {});
        const container = renderButtonGroup(
            { leftConnected: false, rightConnected: false },
            { leftVibrating: false, rightVibrating: false, isVibrating: false },
            send
        );

        const leftButton = container.querySelector('.connect-btn-left');
        leftButton?.click();

        expect(send).toHaveBeenCalledWith({ type: 'connectLeftAction' });
    });

    test('dispatches connectRightAction when right connect button is clicked', () => {
        const send = mock(() => {});
        const container = renderButtonGroup(
            { leftConnected: false, rightConnected: false },
            { leftVibrating: false, rightVibrating: false, isVibrating: false },
            send
        );

        const rightButton = container.querySelector('.connect-btn-right');
        rightButton?.click();

        expect(send).toHaveBeenCalledWith({ type: 'connectRightAction' });
    });

    test('dispatches startVibration when vibrate button is clicked and not vibrating', () => {
        const send = mock(() => {});
        const container = renderButtonGroup(
            { leftConnected: true, rightConnected: true },
            { leftVibrating: false, rightVibrating: false, isVibrating: false },
            send
        );

        const vibrateButton = container.querySelector('#vibrateBtn');
        vibrateButton?.click();

        expect(send).toHaveBeenCalledWith({ type: 'startVibration' });
    });

    test('dispatches stopVibration when vibrate button is clicked and vibrating', () => {
        const send = mock(() => {});
        const container = renderButtonGroup(
            { leftConnected: true, rightConnected: true },
            { leftVibrating: true, rightVibrating: true, isVibrating: true },
            send
        );

        const vibrateButton = container.querySelector('#vibrateBtn');
        vibrateButton?.click();

        expect(send).toHaveBeenCalledWith({ type: 'stopVibration' });
    });

    test('returns a function component', () => {
        expect(typeof ButtonGroup).toBe('function');
    });
});