/**
 * Header component
 */

export function createHeader(html) {
    return function Header(props) {
        return html`
            <h1>🎮 Tapendos</h1>
            <p class="subtitle">
                Alternating Joy-Con vibration for 
                <a href="https://en.wikipedia.org/wiki/Eye_movement_desensitization_and_reprocessing" 
                   target="_blank" 
                   rel="noopener noreferrer">EMDR</a>
            </p>
        `;
    };
}

