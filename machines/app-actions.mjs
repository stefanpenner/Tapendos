/**
 * Action implementations for the app machine
 */

import { JoyCon } from '../joycon.mjs';
import * as presetManager from '../preset-manager.mjs';
import * as vibrationController from '../vibration-controller.mjs';
import { refs } from '../refs.mjs';

/**
 * Get current vibration config from context and refs
 */
export function getCurrentConfig(context) {
    return vibrationController.getCurrentConfig(
        {
            lengthSliderRef: { current: refs.lengthSlider },
            intensitySliderRef: { current: refs.intensitySlider },
            pauseSliderRef: { current: refs.pauseSlider },
            repeatCountInputRef: { current: refs.repeatCountInput }
        },
        {
            lengthValue: context.lengthValue,
            intensityValue: context.intensityValue,
            pauseValue: context.pauseValue,
            repeatMode: context.repeatMode,
            repeatCount: context.repeatCount
        }
    );
}

/**
 * Start vibration with current config
 */
export async function startVibration(context) {
    const send = getSend();
    const config = getCurrentConfig(context);
    
    // Only send error status updates, not success messages
    await vibrationController.startRumble(
        refs.joyCon,
        config,
        refs.currentRumbleAbortController,
        refs.currentRumblePromise,
        (status) => {
            // Only send error status updates to machine
            if (send && status && status.className === 'error') {
                send({ type: 'connectionError', error: status.text });
            }
        }
    );
}

/**
 * Stop current vibration
 */
export function stopVibration() {
    if (refs.currentRumbleAbortController.current) {
        refs.currentRumbleAbortController.current.abort();
        refs.currentRumbleAbortController.current = null;
    }
    if (refs.joyCon) {
        refs.joyCon.stop();
    }
}

/**
 * Apply live config (restart vibration if currently vibrating)
 */
export async function applyLiveConfig(context) {
    await vibrationController.applyLiveConfig(
        refs.joyCon,
        refs.currentRumbleAbortController,
        () => getCurrentConfig(context),
        (config) => startVibration(context)
    );
}

/**
 * Get send function from actor
 */
export function getSend() {
    return refs.appMachineActor ? refs.appMachineActor.send.bind(refs.appMachineActor) : null;
}

/**
 * Connect left Joy-Con
 */
export async function connectLeft() {
    const send = getSend();
    if (!refs.joyCon) {
        refs.joyCon = new JoyCon((state) => {
            if (send) send({ type: 'joyconStateChange', state });
        });
    }
    
    try {
        const devices = refs.joyCon.devices;
        const wasLeft = devices.left;
        const wasRight = devices.right;
        await (devices.left ? refs.joyCon.disconnectLeft() : refs.joyCon.connectLeft());
        
        // Immediately update nested state after successful connection/disconnection
        // The joyconStateChange callback will also fire, but this ensures immediate UI update
        const newDevices = refs.joyCon.devices;
        
        if (newDevices.left && newDevices.right) {
            // Both connected - if right was just connected, send connectRight (from leftConnected state)
            // If left was just connected, send connectLeft (from rightConnected state)
            // If both were already connected, no transition needed
            if (!wasLeft && wasRight) {
                // Left was just connected, we're in rightConnected state
                if (send) send({ type: 'connectLeft' });
            } else if (wasLeft && !wasRight) {
                // Right was just connected, we're in leftConnected state
                if (send) send({ type: 'connectRight' });
            } else if (!wasLeft && !wasRight) {
                // Both were just connected from disconnected state
                if (send) send({ type: 'connectBoth' });
            }
        } else if (newDevices.left && !newDevices.right) {
            // Only left connected
            if (!wasLeft) {
                if (send) send({ type: 'connectLeft' });
            } else if (wasRight) {
                // Right was disconnected
                if (send) send({ type: 'disconnectRight' });
            }
        } else if (newDevices.right && !newDevices.left) {
            // Only right connected
            if (!wasRight) {
                if (send) send({ type: 'connectRight' });
            } else if (wasLeft) {
                // Left was disconnected
                if (send) send({ type: 'disconnectLeft' });
            }
        } else {
            // Neither connected
            if (send) send({ type: 'disconnectAll' });
        }
    } catch (error) {
        // If user cancelled device picker, don't show error - just update state
        if (error.message.includes('No') && error.message.includes('selected')) {
            const currentState = refs.joyCon ? {
                connected: refs.joyCon.isConnected,
                vibrating: refs.joyCon.isVibrating,
                deviceName: refs.joyCon.deviceName,
                devices: refs.joyCon.devices,
                vibratingSide: null,
                remainingCount: null
            } : {
                connected: false,
                vibrating: false,
                deviceName: 'Joy-Con',
                devices: { left: false, right: false },
                vibratingSide: null,
                remainingCount: null
            };
            if (send) send({ type: 'joyconStateChange', state: currentState });
        } else {
            // For other errors, show briefly then allow retry
            if (send) send({ type: 'connectionError', error: error.message });
            setTimeout(() => {
                const currentState = refs.joyCon ? {
                    connected: refs.joyCon.isConnected,
                    vibrating: refs.joyCon.isVibrating,
                    deviceName: refs.joyCon.deviceName,
                    devices: refs.joyCon.devices,
                    vibratingSide: null,
                    remainingCount: null
                } : {
                    connected: false,
                    vibrating: false,
                    deviceName: 'Joy-Con',
                    devices: { left: false, right: false },
                    vibratingSide: null,
                    remainingCount: null
                };
                if (send) send({ type: 'joyconStateChange', state: currentState });
            }, 2000);
        }
    }
}

/**
 * Connect right Joy-Con
 */
export async function connectRight() {
    const send = getSend();
    if (!refs.joyCon) {
        refs.joyCon = new JoyCon((state) => {
            if (send) send({ type: 'joyconStateChange', state });
        });
    }
    
    try {
        const devices = refs.joyCon.devices;
        const wasLeft = devices.left;
        const wasRight = devices.right;
        await (devices.right ? refs.joyCon.disconnectRight() : refs.joyCon.connectRight());
        
        // Immediately update nested state after successful connection/disconnection
        // The joyconStateChange callback will also fire, but this ensures immediate UI update
        const newDevices = refs.joyCon.devices;
        
        if (newDevices.left && newDevices.right) {
            // Both connected - if right was just connected, send connectRight (from leftConnected state)
            // If left was just connected, send connectLeft (from rightConnected state)
            // If both were already connected, no transition needed
            if (!wasLeft && wasRight) {
                // Left was just connected, we're in rightConnected state
                if (send) send({ type: 'connectLeft' });
            } else if (wasLeft && !wasRight) {
                // Right was just connected, we're in leftConnected state
                if (send) send({ type: 'connectRight' });
            } else if (!wasLeft && !wasRight) {
                // Both were just connected from disconnected state
                if (send) send({ type: 'connectBoth' });
            }
        } else if (newDevices.left && !newDevices.right) {
            // Only left connected
            if (!wasLeft) {
                if (send) send({ type: 'connectLeft' });
            } else if (wasRight) {
                // Right was disconnected
                if (send) send({ type: 'disconnectRight' });
            }
        } else if (newDevices.right && !newDevices.left) {
            // Only right connected
            if (!wasRight) {
                if (send) send({ type: 'connectRight' });
            } else if (wasLeft) {
                // Left was disconnected
                if (send) send({ type: 'disconnectLeft' });
            }
        } else {
            // Neither connected
            if (send) send({ type: 'disconnectAll' });
        }
    } catch (error) {
        // If user cancelled device picker, don't show error - just update state
        if (error.message.includes('No') && error.message.includes('selected')) {
            const currentState = refs.joyCon ? {
                connected: refs.joyCon.isConnected,
                vibrating: refs.joyCon.isVibrating,
                deviceName: refs.joyCon.deviceName,
                devices: refs.joyCon.devices,
                vibratingSide: null,
                remainingCount: null
            } : {
                connected: false,
                vibrating: false,
                deviceName: 'Joy-Con',
                devices: { left: false, right: false },
                vibratingSide: null,
                remainingCount: null
            };
            if (send) send({ type: 'joyconStateChange', state: currentState });
        } else {
            // For other errors, show briefly then allow retry
            if (send) send({ type: 'connectionError', error: error.message });
            setTimeout(() => {
                const currentState = refs.joyCon ? {
                    connected: refs.joyCon.isConnected,
                    vibrating: refs.joyCon.isVibrating,
                    deviceName: refs.joyCon.deviceName,
                    devices: refs.joyCon.devices,
                    vibratingSide: null,
                    remainingCount: null
                } : {
                    connected: false,
                    vibrating: false,
                    deviceName: 'Joy-Con',
                    devices: { left: false, right: false },
                    vibratingSide: null,
                    remainingCount: null
                };
                if (send) send({ type: 'joyconStateChange', state: currentState });
            }, 2000);
        }
    }
}

/**
 * Apply preset
 */
export function applyPreset(context, presetId, persist = true) {
    const preset = presetManager.findPreset(presetId);
    
    if (!preset) {
        refs.activePresetId.current = presetManager.CUSTOM_PRESET_ID;
        presetManager.persistPresetSelection(presetManager.CUSTOM_PRESET_ID);
        return {
            selectedPreset: presetManager.CUSTOM_PRESET_ID,
            presetActive: false,
            activePresetId: presetManager.CUSTOM_PRESET_ID
        };
    }
    
    refs.isApplyingPreset.current = true;
    refs.activePresetId.current = presetId;
    
    // Update DOM refs
    if (refs.lengthSlider) refs.lengthSlider.value = preset.values.duration;
    if (refs.intensitySlider) refs.intensitySlider.value = preset.values.amplitude;
    if (refs.pauseSlider) refs.pauseSlider.value = preset.values.pauseDuration;
    if (preset.values.repeatCount !== undefined && refs.repeatCountInput) {
        refs.repeatCountInput.value = preset.values.repeatCount;
    }
    
    refs.isApplyingPreset.current = false;
    
    if (persist) {
        presetManager.persistPresetSelection(presetId);
    }
    
    return {
        selectedPreset: presetId,
        presetActive: true,
        activePresetId: presetId,
        lengthValue: preset.values.duration,
        intensityValue: preset.values.amplitude,
        pauseValue: preset.values.pauseDuration,
        repeatMode: preset.values.repeatMode ?? context.repeatMode,
        repeatCount: preset.values.repeatCount ?? context.repeatCount,
        repeatCountDisplay: preset.values.repeatCount ?? context.repeatCount,
        showRepeatCount: preset.values.repeatMode === 'count'
    };
}

/**
 * Handle manual preset override
 */
export function handleManualPresetOverride(context) {
    if (refs.activePresetId.current === presetManager.CUSTOM_PRESET_ID) {
        return null; // No change needed
    }
    refs.activePresetId.current = presetManager.CUSTOM_PRESET_ID;
    presetManager.persistPresetSelection(presetManager.CUSTOM_PRESET_ID);
    return {
        selectedPreset: presetManager.CUSTOM_PRESET_ID,
        presetActive: false,
        activePresetId: presetManager.CUSTOM_PRESET_ID
    };
}

/**
 * Update status based on connection state
 */
export function getStatusFromConnection(connectionState, errorMessage) {
    if (errorMessage) {
        return { text: errorMessage, className: 'error' };
    }
    
    const statusMap = {
        disconnected: { text: 'no joy-con connected', className: 'disconnected' },
        leftConnected: { text: 'right joy-con not connected', className: 'disconnected' },
        rightConnected: { text: 'left joy-con not connected', className: 'disconnected' },
        connected: { text: 'Connected', className: 'connected' },
        error: { text: errorMessage || 'Error', className: 'error' }
    };
    
    return statusMap[connectionState] || statusMap.disconnected;
}
