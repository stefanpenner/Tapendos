/**
 * Tests for InfoSection component
 */

import { test, expect, describe, beforeEach, mock } from 'bun:test';
import { h, render } from 'preact';
import htm from 'htm';
import { InfoSection } from './InfoSection.mjs';

// DOM environment is set up globally in setup.test.mjs

// Create real HTML template tag
const html = htm.bind(h);

// Helper to render InfoSection with specific state
const renderInfoSection = (isExpanded = false, onToggle = mock(() => {})) => {
    const container = document.createElement('div');

    render(
        InfoSection({ html, isExpanded, onToggle }),
        container
    );

    return container;
};

describe('InfoSection', () => {
    beforeEach(() => {
        // Cleanup if needed
    });

    test('renders collapsed state by default', () => {
        const container = renderInfoSection(false);

        const toggleButton = container.querySelector('.info-toggle');
        expect(toggleButton).toBeDefined();
        expect(toggleButton?.getAttribute('aria-expanded')).toBe('false');
        expect(toggleButton?.textContent?.trim()).toBe('▶ Need help connecting your Joy-Cons?');

        const infoContent = container.querySelector('.info-content');
        expect(infoContent).toBeNull();
    });

    test('renders expanded state when isExpanded is true', () => {
        const container = renderInfoSection(true);

        const toggleButton = container.querySelector('.info-toggle');
        expect(toggleButton).toBeDefined();
        expect(toggleButton?.getAttribute('aria-expanded')).toBe('true');
        expect(toggleButton?.textContent?.trim()).toBe('▼ Need help connecting your Joy-Cons?');

        const infoContent = container.querySelector('.info-content');
        expect(infoContent).toBeDefined();

        const pairingList = infoContent?.querySelector('.pairing-list');
        expect(pairingList).toBeDefined();

        const listItems = pairingList?.querySelectorAll('li');
        expect(listItems?.length).toBe(3);

        // Check content of list items
        expect(listItems?.[0]?.textContent?.trim()).toBe('macOS: Sync button → System Settings > Bluetooth');
        expect(listItems?.[1]?.textContent?.trim()).toBe('Windows: Sync button → Settings > Devices > Bluetooth');
        expect(listItems?.[2]?.textContent?.trim()).toBe('iOS: Not supported');
    });

    test('calls onToggle when toggle button is clicked', () => {
        const onToggle = mock(() => {});
        const container = renderInfoSection(false, onToggle);

        const toggleButton = container.querySelector('.info-toggle');
        toggleButton?.click();

        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    test('shows info content when expanded', () => {
        const container = renderInfoSection(true);

        const infoContent = container.querySelector('.info-content');
        expect(infoContent).toBeDefined();
        expect(infoContent?.textContent).toContain('macOS');
        expect(infoContent?.textContent).toContain('Windows');
        expect(infoContent?.textContent).toContain('iOS');
    });

    test('hides info content when collapsed', () => {
        const container = renderInfoSection(false);

        const infoContent = container.querySelector('.info-content');
        expect(infoContent).toBeNull();
    });

    test('returns a function component', () => {
        expect(typeof InfoSection).toBe('function');
    });
});