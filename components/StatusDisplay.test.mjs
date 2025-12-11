/**
 * Tests for StatusDisplay component
 */

import { test, expect, describe, beforeEach } from 'bun:test';
import { h, render } from 'preact';
import htm from 'htm';
import { StatusDisplay } from './StatusDisplay.mjs';
import { getStatus } from '../hooks/useApp.mjs';

// DOM environment is set up globally in setup.test.mjs

// Create real HTML template tag
const html = htm.bind(h);

// Helper to render StatusDisplay with a specific status
const renderStatusDisplay = (status) => {
    const container = document.createElement('div');

    render(
        StatusDisplay({ html, status }),
        container
    );

    return container;
};

describe('StatusDisplay', () => {
    beforeEach(() => {
        // Cleanup if needed
    });

    const scenarios = [
        // Default/fallback cases
        {
            name: 'null status',
            status: null,
            expectedClassName: 'status disconnected',
            expectedText: 'Loading...'
        },
        {
            name: 'empty status object',
            status: {},
            expectedClassName: 'status disconnected',
            expectedText: 'Loading...'
        },
        
        // Standard status types
        {
            name: 'disconnected',
            status: { text: 'Disconnected', className: 'disconnected' },
            expectedClassName: 'status disconnected',
            expectedText: 'Disconnected'
        },
        {
            name: 'connected',
            status: { text: 'Connected', className: 'connected' },
            expectedClassName: 'status connected',
            expectedText: 'Connected'
        },
        {
            name: 'connecting',
            status: { text: 'Connecting...', className: 'connecting' },
            expectedClassName: 'status connecting',
            expectedText: 'Connecting...'
        },
        {
            name: 'error',
            status: { text: 'Connection failed', className: 'error' },
            expectedClassName: 'status error',
            expectedText: 'Connection failed'
        },
        
        // Partial status objects
        {
            name: 'only text (no className)',
            status: { text: 'Custom message' },
            expectedClassName: 'status disconnected',
            expectedText: 'Custom message'
        },
        {
            name: 'only className (no text)',
            status: { className: 'custom-class' },
            expectedClassName: 'status custom-class',
            expectedText: 'Loading...'
        },
        
        // Edge cases with null/empty values
        {
            name: 'null text',
            status: { text: null, className: 'active' },
            expectedClassName: 'status active',
            expectedText: 'Loading...'
        },
        {
            name: 'empty string text',
            status: { text: '', className: 'active' },
            expectedClassName: 'status active',
            expectedText: 'Loading...'
        },
        {
            name: 'null className',
            status: { text: 'Ready', className: null },
            expectedClassName: 'status disconnected',
            expectedText: 'Ready'
        },
    ];

    test.each(scenarios)('renders correctly: $name', ({ status, expectedClassName, expectedText }) => {
        const container = renderStatusDisplay(status);
        
        // Use querySelector to find the status element
        const statusElement = container.querySelector('#status');
        expect(statusElement).toBeDefined();
        expect(statusElement?.tagName).toBe('DIV');
        expect(statusElement?.getAttribute('id')).toBe('status');
        expect(statusElement?.className).toBe(expectedClassName);
        expect(statusElement?.textContent?.trim()).toBe(expectedText);
    });

    test('returns a function component', () => {
        expect(typeof StatusDisplay).toBe('function');
    });

    describe('getStatus helper', () => {
        test('returns default when status is missing', () => {
            const status = getStatus({ context: {} });
            expect(status).toEqual({ text: 'Loading...', className: 'disconnected' });
        });

        test('returns custom status when provided', () => {
            const status = getStatus({ context: { status: { text: 'Test', className: 'test' } } });
            expect(status).toEqual({ text: 'Test', className: 'test' });
        });
    });
});
