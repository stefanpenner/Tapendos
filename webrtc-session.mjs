/**
 * WebRTC Session Manager for serverless peer-to-peer communication
 * Uses URL-based signaling for offer/answer exchange
 */

const STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' }
];

export class PeerConnectionManager {
    #pc = null;
    #dataChannel = null;
    #onStateChange = null;
    #onMessage = null;
    #role = null;
    #connectionState = 'disconnected';
    #pendingIceCandidates = [];

    constructor(role, onStateChange, onMessage) {
        this.#role = role;
        this.#onStateChange = onStateChange;
        this.#onMessage = onMessage;
    }

    get connectionState() {
        return this.#connectionState;
    }

    get dataChannel() {
        return this.#dataChannel;
    }

    async createOffer() {
        this.#pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
        this.#setupPeerConnection();

        // Create data channel for bidirectional communication
        this.#dataChannel = this.#pc.createDataChannel('vibration', {
            ordered: true
        });
        this.#setupDataChannel(this.#dataChannel);

        const offer = await this.#pc.createOffer();
        await this.#pc.setLocalDescription(offer);
        
        // Wait for ICE gathering to complete
        await this.#waitForIceGathering();
        
        return this.#pc.localDescription.sdp;
    }

    async createAnswer(offerSdp) {
        this.#pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
        this.#setupPeerConnection();

        // Set up data channel listener (created by offerer)
        this.#pc.ondatachannel = (event) => {
            this.#dataChannel = event.channel;
            this.#setupDataChannel(this.#dataChannel);
        };

        await this.#pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
        const answer = await this.#pc.createAnswer();
        await this.#pc.setLocalDescription(answer);
        
        // Wait for ICE gathering to complete
        await this.#waitForIceGathering();
        
        return this.#pc.localDescription.sdp;
    }

    async setAnswer(answerSdp) {
        if (!this.#pc) {
            throw new Error('Peer connection not initialized');
        }
        await this.#pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    }

    async addIceCandidate(candidate) {
        if (!this.#pc) {
            return;
        }
        try {
            await this.#pc.addIceCandidate(candidate);
        } catch (error) {
            console.warn('Error adding ICE candidate:', error);
        }
    }

    #setupPeerConnection() {
        this.#pc.onicecandidate = (event) => {
            if (event.candidate) {
                if (this.#dataChannel?.readyState === 'open') {
                    // Send ICE candidate via data channel if it's open
                    this.#sendMessage({ type: 'ice-candidate', candidate: event.candidate });
                } else {
                    // Store candidate to send later when data channel opens
                    this.#pendingIceCandidates.push(event.candidate);
                }
            }
        };

        this.#pc.onconnectionstatechange = () => {
            const state = this.#pc.connectionState;
            this.#connectionState = state;
            this.#onStateChange?.(state);
        };

        this.#pc.oniceconnectionstatechange = () => {
            const state = this.#pc.iceConnectionState;
            if (state === 'failed' || state === 'disconnected') {
                this.#connectionState = state;
                this.#onStateChange?.(state);
            }
        };
    }

    #setupDataChannel(channel) {
        channel.onopen = () => {
            console.log('Data channel opened');
            // Send any pending ICE candidates that arrived before the channel opened
            while (this.#pendingIceCandidates.length > 0) {
                const candidate = this.#pendingIceCandidates.shift();
                this.#sendMessage({ type: 'ice-candidate', candidate });
            }
            this.#onStateChange?.('connected');
        };

        channel.onclose = () => {
            console.log('Data channel closed');
            this.#onStateChange?.('disconnected');
        };

        channel.onerror = (error) => {
            console.error('Data channel error:', error);
            this.#onStateChange?.('error');
        };

        channel.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                
                // Handle ICE candidates received via data channel
                if (message.type === 'ice-candidate' && message.candidate) {
                    this.addIceCandidate(message.candidate);
                    return;
                }
                
                this.#onMessage?.(message);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
    }

    #sendMessage(message) {
        if (this.#dataChannel?.readyState === 'open') {
            this.#dataChannel.send(JSON.stringify(message));
        } else {
            console.warn('Data channel not open, message not sent:', message);
        }
    }

    sendVibrate(config) {
        this.#sendMessage({ type: 'vibrate', config });
    }

    sendUpdateConfig(config) {
        this.#sendMessage({ type: 'updateConfig', config });
    }

    sendStop() {
        this.#sendMessage({ type: 'stop' });
    }

    sendConnected(joyConConnected) {
        this.#sendMessage({ type: 'connected', joyConConnected });
    }

    sendControllerStatus(devices) {
        this.#sendMessage({ type: 'controllerStatus', devices });
    }

    sendError(message) {
        this.#sendMessage({ type: 'error', message });
    }

    async #waitForIceGathering() {
        return new Promise((resolve) => {
            if (this.#pc.iceGatheringState === 'complete') {
                resolve();
                return;
            }

            const checkState = () => {
                if (this.#pc.iceGatheringState === 'complete') {
                    this.#pc.removeEventListener('icegatheringstatechange', checkState);
                    resolve();
                }
            };

            this.#pc.addEventListener('icegatheringstatechange', checkState);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                this.#pc.removeEventListener('icegatheringstatechange', checkState);
                resolve();
            }, 5000);
        });
    }

    disconnect() {
        if (this.#dataChannel) {
            this.#dataChannel.close();
            this.#dataChannel = null;
        }
        if (this.#pc) {
            this.#pc.close();
            this.#pc = null;
        }
        this.#pendingIceCandidates = [];
        this.#connectionState = 'disconnected';
        this.#onStateChange?.('disconnected');
    }
}

/**
 * URL-based signaling utilities
 */
export class URLSignaling {
    static encodeSdp(sdp) {
        return btoa(sdp).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    static decodeSdp(encoded) {
        try {
            return atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
        } catch (error) {
            throw new Error('Invalid SDP encoding');
        }
    }

    static getRoleFromURL() {
        const params = new URLSearchParams(window.location.search);
        const role = params.get('role');
        // Map 'patient' to 'therapist' for backward compatibility with internal logic
        if (role === 'patient') {
            return 'therapist';
        }
        return role || null;
    }

    static getOfferFromURL() {
        const params = new URLSearchParams(window.location.search);
        const offer = params.get('offer');
        if (!offer) return null;
        try {
            return this.decodeSdp(offer);
        } catch (error) {
            console.error('Error decoding offer:', error);
            return null;
        }
    }

    static getAnswerFromURL() {
        const params = new URLSearchParams(window.location.search);
        const answer = params.get('answer');
        if (!answer) return null;
        try {
            return this.decodeSdp(answer);
        } catch (error) {
            console.error('Error decoding answer:', error);
            return null;
        }
    }

    static createTherapistURL(offerSdp) {
        const encoded = this.encodeSdp(offerSdp);
        const url = new URL(window.location.href);
        // Ensure we're on the multiplayer page
        if (!url.pathname.endsWith('multiplayer.html')) {
            url.pathname = url.pathname.replace(/\/[^\/]*$/, '/multiplayer.html');
        }
        url.searchParams.set('role', 'patient');
        url.searchParams.set('offer', encoded);
        return url.toString();
    }

    static createUserURL(offerSdp, answerSdp) {
        const offerEncoded = this.encodeSdp(offerSdp);
        const answerEncoded = this.encodeSdp(answerSdp);
        const url = new URL(window.location.href);
        // Ensure we're on the multiplayer page
        if (!url.pathname.endsWith('multiplayer.html')) {
            url.pathname = url.pathname.replace(/\/[^\/]*$/, '/multiplayer.html');
        }
        url.searchParams.set('role', 'user');
        url.searchParams.set('offer', offerEncoded);
        url.searchParams.set('answer', answerEncoded);
        return url.toString();
    }

    static watchForAnswer(callback) {
        let lastAnswer = null;
        const checkAnswer = () => {
            const answer = this.getAnswerFromURL();
            if (answer && answer !== lastAnswer) {
                lastAnswer = answer;
                callback(answer);
            }
        };
        
        // Check immediately
        checkAnswer();
        
        // Poll every 500ms
        const interval = setInterval(() => {
            checkAnswer();
        }, 500);
        
        // Also listen to popstate for browser back/forward
        window.addEventListener('popstate', checkAnswer);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('popstate', checkAnswer);
        };
    }

    static clearURL() {
        const url = new URL(window.location.href);
        url.searchParams.delete('role');
        url.searchParams.delete('offer');
        url.searchParams.delete('answer');
        window.history.replaceState({}, '', url.toString());
    }
}

