/**
 * Encodes rumble parameters into a Joy-Con rumble packet.
 * 
 * @param {number} lowFreq - Low frequency in Hz (40.875885 - 626.286133)
 * @param {number} highFreq - High frequency in Hz (81.75177 - 1252.572266)
 * @param {number} amplitude - Amplitude (0 - 1)
 * @returns {Uint8Array} 9-byte rumble packet
 */
export function encodeRumble(lowFreq, highFreq, amplitude) {
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const packet = new Uint8Array(9);
    
    let lf = clamp(lowFreq, 40.875885, 626.286133);
    let hf = clamp(highFreq, 81.75177, 1252.572266);
    
    hf = (Math.round(32 * Math.log2(hf * 0.1)) - 96) * 4;
    lf = Math.round(32 * Math.log2(lf * 0.1)) - 64;
    
    const amp = clamp(amplitude, 0, 1);
    let p = 0;
    
    if (amp > 0) {
        if (amp < 0.117) {
            p = (Math.log2(amp * 1000) * 32 - 96) / (5 - amp ** 2) - 1;
        } else if (amp < 0.23) {
            p = Math.log2(amp * 1000) * 32 - 96 - 92;
        } else {
            p = (Math.log2(amp * 1000) * 32 - 96) * 2 - 246;
        }
    }
    
    // Round p first, but check for edge cases where q would be an exact integer
    // This can cause weaker vibrations at specific amplitude values
    p = Math.round(p);
    let q = p * 0.5;
    
    // If q is an exact integer (even or odd), adjust p slightly to avoid edge cases
    // This prevents weak vibrations at specific amplitude values like 0.45 (q=63)
    if (Number.isInteger(q) && p > 0) {
        // Adjust p by 1 to create a fractional q, ensuring stronger vibration
        p = p + 1;
        q = p * 0.5;
    }
    
    const remainder = q % 2;
    if (remainder > 0) q--;
    q = (q >> 1) + 64;
    if (remainder > 0) q |= 32768;
    
    packet[1] = hf & 255;
    packet[2] = p + ((hf >>> 8) & 255);
    packet[3] = lf + ((q >>> 8) & 255);
    packet[4] = q & 255;
    
    for (let i = 0; i < 4; i++) {
        packet[5 + i] = packet[1 + i];
    }
    
    return packet;
}

const JOYCON_VID = 0x057e;
const JOYCON_LEFT_PID = 0x2006;
const JOYCON_RIGHT_PID = 0x2007;
const RUMBLE_REPORT_ID = 16;
const DEFAULT_DURATION = 300;

export class JoyCon {
    #devices = { left: null, right: null };
    #isConnected = false;
    #isVibrating = false;
    #currentAbortController = null;
    #onStateChange = null;
    #vibratingSide = null;
    #remainingCount = null;

    constructor(onStateChange) {
        this.#onStateChange = onStateChange;
    }

    get isConnected() {
        return this.#isConnected;
    }

    get isVibrating() {
        return this.#isVibrating;
    }

    get deviceName() {
        const names = [];
        if (this.#devices.left) names.push('Left Joy-Con');
        if (this.#devices.right) names.push('Right Joy-Con');
        return names.length > 0 ? names.join(', ') : 'Joy-Con';
    }

    get devices() {
        return {
            left: this.#devices.left !== null,
            right: this.#devices.right !== null
        };
    }

    async #sendCommand(device, reportId, rumbleData, subcommand) {
        if (!device) throw new Error('Device not connected');
        const command = new Uint8Array([...rumbleData, ...subcommand]);
        await device.sendReport(reportId, command);
    }

    async #enableStandardFullMode(device) {
        const rumble = new Uint8Array(9).fill(0);
        await this.#sendCommand(device, 1, rumble, [0x03, 0x30]);
    }

    async #enableVibration(device) {
        const rumble = new Uint8Array([0x00, 0x00, 0x01, 0x40, 0x40, 0x00, 0x01, 0x40, 0x40]);
        await this.#sendCommand(device, 1, rumble, [0x48, 0x01]);
    }

    async #initializeDevice(device) {
        await device.open();
        await this.#enableStandardFullMode(device);
        await this.#enableVibration(device);
    }

    async connect() {
        if (this.#isConnected) {
            throw new Error('Already connected');
        }

        try {
            const devices = await navigator.hid.requestDevice({
                filters: [
                    { vendorId: JOYCON_VID, productId: JOYCON_LEFT_PID },
                    { vendorId: JOYCON_VID, productId: JOYCON_RIGHT_PID }
                ]
            });

            if (devices.length === 0) {
                throw new Error('No Joy-Con selected');
            }

            // Initialize each device separately
            for (const device of devices) {
                const productId = device.productId;
                if (productId === JOYCON_LEFT_PID) {
                    await this.#initializeDevice(device);
                    this.#devices.left = device;
                } else if (productId === JOYCON_RIGHT_PID) {
                    await this.#initializeDevice(device);
                    this.#devices.right = device;
                }
            }

            // Consider connected if at least one device is connected
            this.#isConnected = this.#devices.left !== null || this.#devices.right !== null;
            this.#notifyStateChange();
        } catch (error) {
            // Clean up on error
            await this.#cleanupDevices();
            this.#isConnected = false;
            this.#notifyStateChange();
            throw error;
        }
    }

    async connectLeft() {
        if (this.#devices.left !== null) {
            throw new Error('Left Joy-Con already connected');
        }

        try {
            const devices = await navigator.hid.requestDevice({
                filters: [
                    { vendorId: JOYCON_VID, productId: JOYCON_LEFT_PID }
                ]
            });

            if (devices.length === 0) {
                throw new Error('No left Joy-Con selected');
            }

            const device = devices[0];
            if (device.productId !== JOYCON_LEFT_PID) {
                throw new Error('Selected device is not a left Joy-Con');
            }

            await this.#initializeDevice(device);
            this.#devices.left = device;
            this.#isConnected = true;
            this.#notifyStateChange();
        } catch (error) {
            this.#notifyStateChange();
            throw error;
        }
    }

    async connectRight() {
        if (this.#devices.right !== null) {
            throw new Error('Right Joy-Con already connected');
        }

        try {
            const devices = await navigator.hid.requestDevice({
                filters: [
                    { vendorId: JOYCON_VID, productId: JOYCON_RIGHT_PID }
                ]
            });

            if (devices.length === 0) {
                throw new Error('No right Joy-Con selected');
            }

            const device = devices[0];
            if (device.productId !== JOYCON_RIGHT_PID) {
                throw new Error('Selected device is not a right Joy-Con');
            }

            await this.#initializeDevice(device);
            this.#devices.right = device;
            this.#isConnected = true;
            this.#notifyStateChange();
        } catch (error) {
            this.#notifyStateChange();
            throw error;
        }
    }

    async disconnectLeft() {
        if (this.#devices.left === null) {
            return;
        }

        // Stop vibration if running
        this.stop();

        try {
            await this.#devices.left.close();
        } catch (error) {
            console.error('Error closing left device:', error);
        }

        this.#devices.left = null;
        this.#isConnected = this.#devices.left !== null || this.#devices.right !== null;
        this.#notifyStateChange();
    }

    async disconnectRight() {
        if (this.#devices.right === null) {
            return;
        }

        // Stop vibration if running
        this.stop();

        try {
            await this.#devices.right.close();
        } catch (error) {
            console.error('Error closing right device:', error);
        }

        this.#devices.right = null;
        this.#isConnected = this.#devices.left !== null || this.#devices.right !== null;
        this.#notifyStateChange();
    }

    async #cleanupDevices() {
        const cleanupPromises = [];
        if (this.#devices.left) {
            cleanupPromises.push(
                this.#devices.left.close().catch(() => {})
            );
            this.#devices.left = null;
        }
        if (this.#devices.right) {
            cleanupPromises.push(
                this.#devices.right.close().catch(() => {})
            );
            this.#devices.right = null;
        }
        await Promise.all(cleanupPromises);
    }

    async disconnect() {
        if (!this.#isConnected) {
            return;
        }

        this.stop();

        await this.#cleanupDevices();
        this.#isConnected = false;
        this.#notifyStateChange();
    }

    async rumble(options = {}, abortSignal = null) {
        if (!this.#isConnected) {
            throw new Error('Not connected');
        }

        const {
            lowFreq,
            highFreq,
            amplitude,
            duration,
            repeatMode,
            repeatCount,
            pauseDuration,
        } = this.#normalizeConfig(options);

        // Cancel previous rumble if running
        if (this.#currentAbortController) {
            this.#currentAbortController.abort();
        }

        const abortController = new AbortController();
        const signal = abortSignal || abortController.signal;
        
        if (abortSignal) {
            abortSignal.addEventListener('abort', () => abortController.abort());
        }
        
        this.#currentAbortController = abortController;

        this.#isVibrating = true;
        this.#notifyStateChange();

        try {
            await this.#runAlternatingRumble({
                lowFreq,
                highFreq,
                amplitude,
                duration,
                repeatMode,
                repeatCount,
                pauseDuration,
            }, signal);
        } catch (error) {
            if (error.name !== 'AbortError') {
                throw error;
            }
        } finally {
            this.#isVibrating = false;
            this.#remainingCount = null;
            if (this.#currentAbortController === abortController) {
                this.#currentAbortController = null;
            }
            this.#notifyStateChange();
        }
    }

    async #runAlternatingRumble(config, signal) {
        const { lowFreq, highFreq, amplitude, duration, repeatMode, repeatCount, pauseDuration } = config;
        const rumblePacket = encodeRumble(lowFreq, highFreq, amplitude);
        const stopPacket = encodeRumble(600, 600, 0);

        const sendStop = (device) => {
            if (device && !signal.aborted) {
                device.sendReport(RUMBLE_REPORT_ID, stopPacket).catch((error) => {
                    console.error('Error sending stop packet:', error);
                });
            }
        };

        const sendStopBoth = () => {
            sendStop(this.#devices.left);
            sendStop(this.#devices.right);
        };

        const buzzDevice = async (device, ms) => {
            if (!device || signal.aborted) return;
            
            try {
                await device.sendReport(RUMBLE_REPORT_ID, rumblePacket);
            } catch (error) {
                console.error('Error sending rumble packet:', error);
                throw error;
            }

            // Send stop packets continuously after duration
            let stopInterval = null;
            const stopTimeout = setTimeout(() => {
                sendStop(device);
                stopInterval = setInterval(() => sendStop(device), 5);
            }, ms);

            // Wait for duration
            await this.#waitWithAbort(ms, signal);

            // Cleanup
            clearTimeout(stopTimeout);
            if (stopInterval) clearInterval(stopInterval);
            sendStop(device);
        };

        let cyclesCompleted = 0;
        const isUnlimited = repeatMode === 'unlimited';
        const maxCycles = isUnlimited ? Infinity : repeatCount;
        
        // Initialize remaining count for countdown display
        if (!isUnlimited) {
            this.#remainingCount = repeatCount;
            this.#notifyStateChange();
        }

        while (!signal.aborted && cyclesCompleted < maxCycles) {
            // Left buzz
            if (this.#devices.left) {
                this.#setVibratingSide('left');
                await buzzDevice(this.#devices.left, duration);
                if (!signal.aborted) {
                    this.#setVibratingSide(null);
                }
            }
            
            if (signal.aborted) break;

            // Pause (silent period)
            await this.#waitWithAbort(pauseDuration, signal);
            
            if (signal.aborted) break;

            // Right buzz
            if (this.#devices.right) {
                this.#setVibratingSide('right');
                await buzzDevice(this.#devices.right, duration);
                if (!signal.aborted) {
                    this.#setVibratingSide(null);
                }
            }
            
            if (signal.aborted) break;

            cyclesCompleted++;
            
            // Update remaining count for countdown display
            if (!isUnlimited) {
                this.#remainingCount = Math.max(0, repeatCount - cyclesCompleted);
                this.#notifyStateChange();
            }

            // If not unlimited and we've reached the count, break
            if (!isUnlimited && cyclesCompleted >= maxCycles) {
                break;
            }

            // Pause before next cycle (if repeating)
            if (cyclesCompleted < maxCycles) {
                await this.#waitWithAbort(pauseDuration, signal);
            }
        }

        this.#setVibratingSide(null);
        this.#remainingCount = null;
        sendStopBoth();
    }

    #waitWithAbort(ms, signal) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, ms);
            signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new DOMException('Aborted', 'AbortError'));
            });
        });
    }


    stop() {
        if (this.#currentAbortController) {
            this.#currentAbortController.abort();
            this.#currentAbortController = null;
        }
        this.#vibratingSide = null;
    }

    #normalizeConfig(options = {}) {
        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        const toNumber = (value, fallback) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : fallback;
        };

        const duration = clamp(toNumber(options.duration, DEFAULT_DURATION), 10, 2000);
        const pauseDuration = Math.max(0, toNumber(options.pauseDuration, 0));
        const amplitude = clamp(toNumber(options.amplitude, 0.5), 0, 1);
        const repeatCount = Math.max(1, Math.floor(toNumber(options.repeatCount, 1)));
        const repeatMode = options.repeatMode === 'count' ? 'count' : 'unlimited';

        return {
            lowFreq: toNumber(options.lowFreq, 600),
            highFreq: toNumber(options.highFreq, 600),
            amplitude,
            duration,
            repeatMode,
            repeatCount,
            pauseDuration,
        };
    }

    #setVibratingSide(side) {
        if (this.#vibratingSide === side) {
            return;
        }
        this.#vibratingSide = side;
        this.#notifyStateChange();
    }

    #notifyStateChange() {
        if (this.#onStateChange) {
            this.#onStateChange({
                connected: this.#isConnected,
                vibrating: this.#isVibrating,
                deviceName: this.deviceName,
                devices: this.devices,
                vibratingSide: this.#vibratingSide,
                remainingCount: this.#remainingCount
            });
        }
    }

    handleDisconnect(disconnectedDevice) {
        let disconnected = false;
        if (disconnectedDevice === this.#devices.left) {
            this.#devices.left = null;
            disconnected = true;
        }
        if (disconnectedDevice === this.#devices.right) {
            this.#devices.right = null;
            disconnected = true;
        }

        if (disconnected) {
            // Stop vibration if no devices remain
            if (this.#devices.left === null && this.#devices.right === null) {
                this.stop();
                this.#isConnected = false;
            }
            this.#notifyStateChange();
        }
    }
}

