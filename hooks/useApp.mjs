/**
 * Hook for accessing the app state machine
 */

import { createActor } from 'xstate';
import { appMachine } from '../machines/app.mjs';
import { refs } from '../refs.mjs';
import { useState, useEffect, useMemo } from 'preact/hooks';

let appActor = null;

/**
 * Get or create the app machine actor
 */
function getAppActor() {
    if (!appActor) {
        appActor = createActor(appMachine);
        appActor.start();
        refs.appMachineActor = appActor;
    }
    return appActor;
}

/**
 * Hook to access app state machine
 * Returns [state, send] tuple similar to useActor
 */
export function useApp() {
    const actor = useMemo(() => getAppActor(), []);
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
