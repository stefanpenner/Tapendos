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
    
    let q = Math.round(p) * 0.5;
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
const VIBRATION_DURATION = 300;

export class JoyCon {
    #device = null;
    #isConnected = false;
    #isInitialized = false;
    #isVibrating = false;
    #vibrationTimeout = null;
    #onStateChange = null;

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
        return this.#device?.productName || 'Joy-Con';
    }

    async #sendCommand(reportId, rumbleData, subcommand) {
        if (!this.#device) throw new Error('Device not connected');
        const command = new Uint8Array([...rumbleData, ...subcommand]);
        await this.#device.sendReport(reportId, command);
    }

    async #enableStandardFullMode() {
        const rumble = new Uint8Array(9).fill(0);
        await this.#sendCommand(1, rumble, [0x03, 0x30]);
    }

    async #enableVibration() {
        const rumble = new Uint8Array([0x00, 0x00, 0x01, 0x40, 0x40, 0x00, 0x01, 0x40, 0x40]);
        await this.#sendCommand(1, rumble, [0x48, 0x01]);
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

            this.#device = devices[0];
            await this.#device.open();
            await this.#enableStandardFullMode();
            await this.#enableVibration();

            this.#isConnected = true;
            this.#isInitialized = true;
            this.#notifyStateChange();
        } catch (error) {
            this.#device = null;
            this.#isConnected = false;
            this.#isInitialized = false;
            this.#notifyStateChange();
            throw error;
        }
    }

    async disconnect() {
        if (!this.#isConnected) {
            return;
        }

        this.#stopVibration();

        try {
            if (this.#device) {
                await this.#device.close();
            }
        } catch (error) {
            // Ignore close errors
        }

        this.#device = null;
        this.#isConnected = false;
        this.#isInitialized = false;
        this.#notifyStateChange();
    }

    async vibrate(lowFreq = 600, highFreq = 600, amplitude = 0.5) {
        if (!this.#isConnected) {
            throw new Error('Not connected');
        }

        if (this.#isVibrating) {
            throw new Error('Already vibrating');
        }

        try {
            this.#isVibrating = true;
            this.#notifyStateChange();

            const rumblePacket = encodeRumble(lowFreq, highFreq, amplitude);
            await this.#device.sendReport(RUMBLE_REPORT_ID, rumblePacket);

            this.#vibrationTimeout = setTimeout(() => {
                this.#stopVibration();
            }, VIBRATION_DURATION);
        } catch (error) {
            this.#isVibrating = false;
            this.#notifyStateChange();
            throw error;
        }
    }

    #stopVibration() {
        if (this.#vibrationTimeout) {
            clearTimeout(this.#vibrationTimeout);
            this.#vibrationTimeout = null;
        }

        if (this.#isVibrating && this.#device) {
            this.#isVibrating = false;
            this.#notifyStateChange();

            const stopPacket = new Uint8Array(9);
            this.#device.sendReport(RUMBLE_REPORT_ID, stopPacket).catch(() => {
                // Ignore stop errors
            });
        }
    }

    #notifyStateChange() {
        if (this.#onStateChange) {
            this.#onStateChange({
                connected: this.#isConnected,
                vibrating: this.#isVibrating,
                deviceName: this.deviceName
            });
        }
    }

    handleDisconnect(disconnectedDevice) {
        if (disconnectedDevice === this.#device) {
            this.#device = null;
            this.#isConnected = false;
            this.#isInitialized = false;
            this.#stopVibration();
            this.#notifyStateChange();
        }
    }
}

