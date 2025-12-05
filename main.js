import { h, render } from 'preact';
import htm from 'htm';
import { createApp } from './app.mjs';

const html = htm.bind(h);
const App = createApp(html);

render(html`<${App} />`, document.getElementById('app'));

