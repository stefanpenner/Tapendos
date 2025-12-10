/**
 * Hook for accessing the app state machine
 */

import { createContext } from 'preact';
import { useContext, useState, useEffect, useMemo } from 'preact/hooks';
import { createActor } from 'xstate';
import { appMachine } from '../machines/app.mjs';
import { refs } from '../refs.mjs';

// Create context for the app actor
const AppActorContext = createContext(null);

/**
 * Provider component that creates and manages the app actor
 * Accepts an optional `actor` prop for testing
 */
export function AppActorProvider({ children, html, actor: providedActor }) {
    const actor = useMemo(() => {
        if (providedActor) {
            // Use provided actor (for testing)
            refs.appMachineActor = providedActor;
            return providedActor;
        }
        // Create new actor (for production)
        const newActor = createActor(appMachine);
        newActor.start();
        // Keep refs for backward compatibility with app-actions
        refs.appMachineActor = newActor;
        return newActor;
    }, [providedActor]);

    useEffect(() => {
        if (!providedActor) {
            // Only start if we created the actor
            actor.start();
        }
        return () => {
            if (!providedActor) {
                // Only stop if we created the actor
                actor.stop();
            }
            refs.appMachineActor = null;
        };
    }, [actor, providedActor]);

    return html`
        <${AppActorContext.Provider} value=${actor}>
            ${children}
        <//>
    `;
}

/**
 * Hook to access app state machine
 * Returns [state, send] tuple similar to useActor
 */
export function useApp() {
    const actor = useContext(AppActorContext);
    
    if (!actor) {
        throw new Error('useApp must be used within AppActorProvider');
    }
    
    const [state, setState] = useState(actor.getSnapshot());
    
    useEffect(() => {
        const subscription = actor.subscribe((snapshot) => {
            setState(snapshot);
        });
        
        return () => {
            subscription.unsubscribe();
        };
    }, [actor]);
    
    return [state, actor.send.bind(actor)];
}

/**
 * Helper selectors for convenience
 */
export function getConnectionState(state) {
    return {
        leftConnected: state.context.leftConnected,
        rightConnected: state.context.rightConnected,
        connectionState: state.context.connectionState,
        errorMessage: state.context.errorMessage
    };
}

export function getVibrationState(state) {
    return {
        isVibrating: state.context.isVibrating,
        leftVibrating: state.context.leftVibrating,
        rightVibrating: state.context.rightVibrating,
        remainingCount: state.context.remainingCount
    };
}

export function getSettings(state) {
    return {
        lengthValue: state.context.lengthValue,
        intensityValue: state.context.intensityValue,
        pauseValue: state.context.pauseValue,
        repeatMode: state.context.repeatMode,
        repeatCount: state.context.repeatCount,
        repeatCountDisplay: state.context.repeatCountDisplay,
        showRepeatCount: state.context.showRepeatCount
    };
}

export function getPresets(state) {
    return {
        presetOptions: state.context.presetOptions,
        selectedPreset: state.context.selectedPreset,
        presetActive: state.context.presetActive
    };
}

export function getStatus(state) {
    return state.context.status || { text: 'Loading...', className: 'disconnected' };
}
