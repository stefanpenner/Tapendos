/**
 * Header component
 */

export function createHeader(html) {
    return function Header(props) {
        return html`
            <div class="header-content">
                <img src="./logo.png" alt="EMDR Logo" class="logo" />
                <h1>Tapendos</h1>
            </div>
            <p class="subtitle">
                Alternating Joy-Con vibration for 
                <a href="https://en.wikipedia.org/wiki/Eye_movement_desensitization_and_reprocessing" 
                   target="_blank" 
                   rel="noopener noreferrer">EMDR</a>
            </p>
        `;
    };
}

