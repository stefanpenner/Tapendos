/**
 * App Context - provides shared state and functions to components
 */

import { createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

export const AppContext = createContext(null);

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppContext.Provider');
    }
    return context;
}

/**
 * Selector hook - only re-renders when connection slice changes
 * Since connection is memoized at the source, we can return it directly
 */
export function useConnection() {
    const ctx = useAppContext();
    return ctx.connection;
}

/**
 * Selector hook - only re-renders when vibration slice changes
 * Since vibration is memoized at the source, we can return it directly
 */
export function useVibration() {
    const ctx = useAppContext();
    return ctx.vibration;
}

/**
 * Selector hook - only re-renders when presets slice changes
 * Since presets is memoized at the source, we can return it directly
 */
export function usePresets() {
    const ctx = useAppContext();
    return ctx.presets;
}

/**
 * Selector hook - only re-renders when refs slice changes (refs are stable, so this rarely changes)
 */
export function useRefs() {
    const ctx = useAppContext();
    return ctx.refs; // Refs are stable, no need to memoize
}

/**
 * Selector hook - only re-renders when status changes
 */
export function useStatus() {
    const ctx = useAppContext();
    return useMemo(() => ctx.status, [ctx.status.text, ctx.status.className]);
}

