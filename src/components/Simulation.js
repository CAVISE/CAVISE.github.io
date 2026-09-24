import { Hero } from './Hero.js';

export function Simulation({ hero, steps, links }) {
  const logoUrl = `${import.meta.env.BASE_URL}assets/images/cavise-logo.svg`;
  const stepMarkup = steps.map(({ kicker, title, description }) => `
    <article class="step-copy">
      <span class="step-kicker">${kicker}</span>
      <h2>${title}</h2>
      <p>${description}</p>
    </article>
  `).join('');

  const navigationMarkup = steps.map(({ title }, index) => `
    <button
      type="button"
      class="${index === 0 ? 'active' : ''}"
      aria-label="${title}"
      aria-current="${index === 0 ? 'step' : 'false'}"
    ></button>
  `).join('');

  const linksMarkup = links.map(({ label, value, href }) => `
    <a href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''}>
      <span><b>${label}</b><small>${value}</small></span>
      <i aria-hidden="true">↗</i>
    </a>
  `).join('');

  return `
    <section class="scroll-section" id="scrollSection" aria-label="CAVISE simulation layers">
      <div class="stage" id="stage">
        <div class="scene-viewport" id="sceneViewport">
          <canvas id="scene" aria-label="Animated connected vehicle simulation"></canvas>
          <div class="vignette" aria-hidden="true"></div>
        </div>

        ${Hero(hero)}

        <div class="stage-ui">
          <div class="brand">
            <img src="${logoUrl}" alt="CAVISE">
          </div>
          <div class="counter" aria-live="polite">
            <i class="counter-dot"></i>
            <span id="counterText">01 / ${String(steps.length).padStart(2, '0')}</span>
          </div>
          <div class="copy-stack">${stepMarkup}</div>
          <nav class="progress-nav" aria-label="Simulation stages">${navigationMarkup}</nav>
          <nav class="stage-links" aria-label="CAVISE resources">${linksMarkup}</nav>
        </div>
      </div>
    </section>
  `;
}
