import { Icon } from './Icon.js';

function renderAction(action) {
  return `
    <a
      class="hero-action ${action.primary ? 'hero-action--primary' : ''}"
      href="${action.href}"
      target="_blank"
      rel="noreferrer"
    >
      <span>${action.label}</span>
      ${action.icon ? Icon(action.icon) : ''}
    </a>
  `;
}

export function Hero({ title, description, actions, scrollHint }) {
  return `
    <header class="hero-layer" id="heroLayer">
      <div class="hero-content">
        <h1 class="hero-title">${title}</h1>
        <p class="hero-description">${description}</p>
        <div class="hero-actions">${actions.map(renderAction).join('')}</div>
      </div>

      <div class="hero-footer">
        <div class="scroll-hint" aria-hidden="true">
          <span class="scroll-hint__desktop">${scrollHint}</span>
          <span class="scroll-hint__mobile">Swipe to explore</span>
          ${Icon('arrow', 'scroll-hint__arrow')}
        </div>
      </div>
    </header>
  `;
}
