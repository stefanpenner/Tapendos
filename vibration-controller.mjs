/**
 * Vibration control logic
 */

export function getCurrentConfig(refs, state) {
    const { lengthSliderRef, intensitySliderRef, pauseSliderRef, repeatCountInputRef } = refs;
    const { lengthValue, intensityValue, pauseValue, repeatMode, repeatCount } = state;
    
    return {
        duration: parseInt(lengthSliderRef.current?.value || lengthValue, 10),
        amplitude: parseFloat(intensitySliderRef.current?.value || intensityValue),
        pauseDuration: parseInt(pauseSliderRef.current?.value || pauseValue, 10),
        repeatMode: repeatMode,
        repeatCount: parseInt(repeatCountInputRef.current?.value || repeatCount, 10) || 1,
    };
}

export async function startRumble(joyCon, config, abortControllerRef, promiseRef, setStatus) {
    if (!joyCon?.isConnected) {
        return;
    }

    const devices = joyCon.devices;
    if (!devices.left || !devices.right) {
        setStatus({ text: 'Error: Both controllers must be connected to vibrate', className: 'error' });
        return;
    }

    if (typeof joyCon.rumble !== 'function') {
        setStatus({ text: 'Error: rumble method not available', className: 'error' });
        return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
        promiseRef.current = joyCon.rumble({
            lowFreq: 600,
            highFreq: 600,
            amplitude: config.amplitude,
            duration: config.duration,
            repeatMode: config.repeatMode,
            repeatCount: config.repeatCount,
            pauseDuration: config.pauseDuration,
        }, abortController.signal);

        await promiseRef.current;
    } catch (error) {
        if (error.name !== 'AbortError') {
            setStatus({ text: `Vibration error: ${error.message}`, className: 'error' });
        }
    } finally {
        if (abortControllerRef.current === abortController) {
            abortControllerRef.current = null;
            promiseRef.current = null;
        }
    }
}

export async function applyLiveConfig(joyCon, abortControllerRef, getCurrentConfig, startRumbleFn) {
    if (joyCon?.isVibrating && abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        if (joyCon?.isConnected) {
            const config = getCurrentConfig();
            await startRumbleFn(config);
        }
    }
}

export function formatAmplitudeDisplay(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return value;
    }
    return (Math.round(parsed * 100) / 100).toString();
}

