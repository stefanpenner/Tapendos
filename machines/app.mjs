/**
 * Main application state machine
 * Manages connection, vibration, settings, and presets
 */

import { createMachine, assign } from 'xstate';
import * as presetManager from '../preset-manager.mjs';
import { refs } from '../refs.mjs';
import * as actions from './app-actions.mjs';

export const appMachine = createMachine({
    id: 'app',
    initial: 'idle',
    context: {
        // Connection state
        leftConnected: false,
        rightConnected: false,
        connectionState: 'disconnected',
        errorMessage: null,
        
        // Vibration state
        isVibrating: false,
        leftVibrating: false,
        rightVibrating: false,
        remainingCount: null,
        
        // Vibration settings
        lengthValue: 500,
        intensityValue: 0.5,
        pauseValue: 800,
        repeatMode: 'unlimited',
        repeatCount: 1,
        repeatCountDisplay: 1,
        showRepeatCount: false,
        
        // Presets
        presetOptions: [],
        selectedPreset: 'standard-processing',
        presetActive: false,
        activePresetId: 'standard-processing',
        isApplyingPreset: false,
        showAdvancedControls: false,
        
        // Status
        status: { text: 'Disconnected', className: 'disconnected' }
    },
    states: {
        idle: {
            initial: 'disconnected',
            states: {
                disconnected: {
                    entry: 'updateStatus',
                    on: {
                        connectLeft: 'leftConnected',
                        connectRight: 'rightConnected',
                        connectBoth: 'connected',
                        error: {
                            target: 'error',
                            actions: 'setError'
                        }
                    }
                },
                leftConnected: {
                    entry: ['setLeftConnected', 'updateStatus'],
                    on: {
                        connectRight: {
                            target: 'connected',
                            actions: 'setRightConnected'
                        },
                        disconnectLeft: {
                            target: 'disconnected',
                            actions: 'clearLeftConnected'
                        },
                        error: {
                            target: 'error',
                            actions: 'setError'
                        }
                    }
                },
                rightConnected: {
                    entry: ['setRightConnected', 'updateStatus'],
                    on: {
                        connectLeft: {
                            target: 'connected',
                            actions: 'setLeftConnected'
                        },
                        disconnectRight: {
                            target: 'disconnected',
                            actions: 'clearRightConnected'
                        },
                        error: {
                            target: 'error',
                            actions: 'setError'
                        }
                    }
                },
                connected: {
                    entry: ['setBothConnected', 'updateStatus'],
                    on: {
                        disconnectLeft: {
                            target: 'rightConnected',
                            actions: 'clearLeftConnected'
                        },
                        disconnectRight: {
                            target: 'leftConnected',
                            actions: 'clearRightConnected'
                        },
                        disconnectBoth: {
                            target: 'disconnected',
                            actions: 'clearBothConnected'
                        },
                        error: {
                            target: 'error',
                            actions: 'setError'
                        }
                    }
                },
                error: {
                    entry: 'updateStatus',
                    on: {
                        connectLeft: {
                            target: 'leftConnected',
                            actions: 'clearError'
                        },
                        connectRight: {
                            target: 'rightConnected',
                            actions: 'clearError'
                        },
                        connectBoth: {
                            target: 'connected',
                            actions: 'clearError'
                        },
                        disconnectAll: {
                            target: 'disconnected',
                            actions: ['clearBothConnected', 'clearError']
                        }
                    }
                }
            },
            on: {
                startVibration: {
                    target: 'vibrating',
                    guard: ({ context }) => context.leftConnected && context.rightConnected,
                    actions: 'startVibration'
                },
                setLength: {
                    actions: ['updateLength', 'handleManualOverride', 'applyLiveConfig']
                },
                setIntensity: {
                    actions: ['updateIntensity', 'handleManualOverride', 'applyLiveConfig']
                },
                setPause: {
                    actions: ['updatePause', 'handleManualOverride', 'applyLiveConfig']
                },
                setRepeatMode: {
                    actions: ['updateRepeatMode', 'applyLiveConfig']
                },
                setRepeatCount: {
                    actions: ['updateRepeatCount', 'applyLiveConfig']
                },
                setRepeatCountDisplay: {
                    actions: 'updateRepeatCountDisplay'
                },
                loadPresets: {
                    actions: 'updatePresetOptions'
                },
                applyPreset: {
                    actions: ['applyPreset', 'applyLiveConfig']
                },
                manualOverride: {
                    actions: 'handleManualPresetOverride'
                },
                setPresetActive: {
                    actions: 'updatePresetActive'
                },
                toggleAdvancedControls: {
                    actions: 'toggleAdvancedControls'
                },
                connectLeftAction: {
                    actions: 'connectLeft'
                },
                connectRightAction: {
                    actions: 'connectRight'
                },
                joyconStateChange: {
                    actions: 'handleJoyConStateChange'
                },
                connectionError: {
                    actions: 'setConnectionError'
                },
                setStatus: {
                    actions: 'setStatus'
                }
            }
        },
        vibrating: {
            entry: assign({ isVibrating: true }),
            exit: assign({ isVibrating: false }),
            on: {
                stopVibration: {
                    target: 'idle',
                    actions: 'stopVibration'
                },
                updateRemainingCount: {
                    actions: 'updateRemainingCount'
                },
                joyconStateChange: {
                    actions: 'handleJoyConStateChange',
                    target: 'idle'
                },
                connectLeftAction: {
                    actions: 'connectLeft'
                },
                connectRightAction: {
                    actions: 'connectRight'
                },
                connectionError: {
                    actions: 'setConnectionError'
                }
            }
        }
    }
}, {
    actions: {
        // Connection state updates
        setLeftConnected: assign({
            leftConnected: true,
            connectionState: 'leftConnected'
        }),
        setRightConnected: assign({
            rightConnected: true,
            connectionState: 'rightConnected'
        }),
        setBothConnected: assign({
            leftConnected: true,
            rightConnected: true,
            connectionState: 'connected'
        }),
        clearLeftConnected: assign({
            leftConnected: false,
            connectionState: ({ context }) => context.rightConnected ? 'rightConnected' : 'disconnected'
        }),
        clearRightConnected: assign({
            rightConnected: false,
            connectionState: ({ context }) => context.leftConnected ? 'leftConnected' : 'disconnected'
        }),
        clearBothConnected: assign({
            leftConnected: false,
            rightConnected: false,
            connectionState: 'disconnected'
        }),
        clearError: assign({ errorMessage: null }),
        setError: assign({
            connectionState: 'error',
            errorMessage: (_, event) => event?.error || event?.message || null
        }),
        updateStatus: assign({
            status: ({ context }) => actions.getStatusFromConnection(context.connectionState, context.errorMessage)
        }),
        setConnectionError: assign({
            errorMessage: (_, event) => event?.error || null,
            status: (_, event) => actions.getStatusFromConnection('error', event?.error || null)
        }),
        // Test-only action to set status directly (for testing)
        setStatus: assign({
            status: (_, event) => event.status || { text: 'Loading...', className: 'disconnected' }
        }),
        
        // Settings updates
        updateLength: assign({ lengthValue: (_, event) => event.value }),
        updateIntensity: assign({ intensityValue: (_, event) => event.value }),
        updatePause: assign({ pauseValue: (_, event) => event.value }),
        updateRepeatMode: assign({
            repeatMode: (_, event) => event.value,
            showRepeatCount: (_, event) => event.value === 'count'
        }),
        updateRepeatCount: assign({
            repeatCount: (_, event) => event.value,
            repeatCountDisplay: (_, event) => event.value
        }),
        updateRepeatCountDisplay: assign({
            repeatCountDisplay: (_, event) => event.value
        }),
        updateRemainingCount: assign({
            remainingCount: (_, event) => event.count,
            repeatCountDisplay: ({ context }, event) => {
                if (context.repeatMode === 'count') {
                    return event.count;
                }
                return context.repeatCountDisplay;
            }
        }),
        
        // Preset updates
        updatePresetOptions: assign({ presetOptions: (_, event) => event?.presetOptions || [] }),
        updatePresetActive: assign({ presetActive: (_, event) => event?.value ?? false }),
        toggleAdvancedControls: assign({ showAdvancedControls: (context) => !context.showAdvancedControls }),
        applyPreset: assign((context, event) => {
            if (!event?.presetId) return {};
            const updates = actions.applyPreset(context, event.presetId, event.persist !== false);
            return updates || {};
        }),
        handleManualPresetOverride: assign((context) => {
            const updates = actions.handleManualPresetOverride(context);
            return updates || {};
        }),
        
        // Vibration actions
        startVibration: async ({ context, self }) => {
            const send = self.send.bind(self);
            await actions.startVibration({ context, send });
        },
        stopVibration: () => {
            actions.stopVibration();
        },
        applyLiveConfig: async ({ context, self }) => {
            if (!refs.isApplyingPreset.current) {
                const send = self.send.bind(self);
                await actions.applyLiveConfig({ context, send });
            }
        },
        
        // Connection actions
        connectLeft: async ({ self }) => {
            const send = self.send.bind(self);
            await actions.connectLeft({ send });
        },
        connectRight: async ({ self }) => {
            const send = self.send.bind(self);
            await actions.connectRight({ send });
        },
        
        // JoyCon state change handler
        handleJoyConStateChange: assign((context, event, meta) => {
            if (!event?.state) return {};
            const state = event.state;
            const updates = {
                leftConnected: state.devices.left,
                rightConnected: state.devices.right,
                isVibrating: state.vibrating
            };
            
            // Update vibration side
            if (state.vibratingSide === 'left') {
                updates.leftVibrating = true;
                updates.rightVibrating = false;
            } else if (state.vibratingSide === 'right') {
                updates.leftVibrating = false;
                updates.rightVibrating = true;
            } else {
                updates.leftVibrating = false;
                updates.rightVibrating = false;
            }
            
            // Update remaining count
            if (state.vibrating && state.remainingCount !== null && context.repeatMode === 'count') {
                updates.remainingCount = state.remainingCount;
                updates.repeatCountDisplay = state.remainingCount;
            } else if (!state.vibrating && context.repeatMode === 'count') {
                const display = parseInt(refs.repeatCountInput?.value || context.repeatCount, 10);
                updates.repeatCountDisplay = display;
                updates.remainingCount = null;
            }
            
            // Update connection state
            const leftConnected = state.devices.left;
            const rightConnected = state.devices.right;
            let connectionState = 'disconnected';
            if (leftConnected && rightConnected) {
                connectionState = 'connected';
            } else if (leftConnected) {
                connectionState = 'leftConnected';
            } else if (rightConnected) {
                connectionState = 'rightConnected';
            }
            
            updates.connectionState = connectionState;
            updates.status = actions.getStatusFromConnection(connectionState, null);
            
            // Note: Connection events are sent immediately after connect/disconnect actions
            // This handler just updates context based on the actual JoyCon state
            
            return updates;
        })
    }
});
