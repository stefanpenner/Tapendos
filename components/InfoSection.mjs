/**
 * Info section component
 */

import { useState } from 'preact/hooks';

export function createInfoSection(html) {
    return function InfoSection(props) {
        const [isExpanded, setIsExpanded] = useState(false);
        
        return html`
        <div class="info">
            <button 
                class="info-toggle"
                onClick=${() => setIsExpanded(!isExpanded)}
                aria-expanded=${isExpanded}
            >
                ${isExpanded ? '▼' : '▶'} Need help connecting your Joy-Cons?
            </button>
            ${isExpanded ? html`
                <div class="info-content">
                    <p>Before connecting, make sure your Joy-Cons are paired with your computer via Bluetooth:</p>
                    <ul class="pairing-list">
                        <li>
                            <strong>macOS:</strong> 
                            <a href="https://support.apple.com/guide/games/connect-a-game-controller-devf8cec167c/mac" 
                               target="_blank" 
                               rel="noopener noreferrer">Pairing instructions</a> 
                            — Hold the sync button on your Joy-Con until lights flash, then select it in System Settings > Bluetooth
                        </li>
                        <li>
                            <strong>Windows:</strong> 
                            <a href="https://www.tomsguide.com/us/use-joy-cons-on-pc-mac,news-25419.html" 
                               target="_blank" 
                               rel="noopener noreferrer">Pairing instructions</a> 
                            — Hold the sync button, then add via Settings > Devices > Bluetooth
                        </li>
                        <li>
                            <strong>iOS:</strong> Joy-Cons are not compatible with iOS devices. This app requires WebHID support (Chrome/Edge 89+ on desktop)
                        </li>
                    </ul>
                </div>
            ` : null}
        </div>
    `;
    };
}

