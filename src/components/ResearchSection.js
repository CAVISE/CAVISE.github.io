import { Icon } from './Icon.js';

function linkAttributes(href) {
  return href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : '';
}

function renderPublication(publication, index, publications) {
  const tagName = publication.href ? 'a' : 'article';
  const link = publication.href
    ? ` href="${publication.href}"${linkAttributes(publication.href)}`
    : '';

  return `
    <${tagName} class="publication-card" data-carousel-card aria-label="Publication ${index + 1} of ${publications.length}"${link}>
      <div class="publication-card__icon">${Icon('document')}</div>
      <div class="publication-card__content">
        <div class="publication-card__meta">
          <strong>${publication.year}</strong>
          <span>${publication.venue}</span>
        </div>
        <h3>${publication.title}</h3>
      </div>
    </${tagName}>
  `;
}

function renderMediaMention(mention, index, mentions) {
  return `
    <a
      class="media-card"
      data-carousel-card
      href="${mention.href}"
      target="_blank"
      rel="noreferrer"
      aria-label="${mention.title}. Media mention ${index + 1} of ${mentions.length}"
    >
      <div class="media-card__preview">
        <img src="${mention.image}" alt="" loading="lazy" decoding="async">
      </div>
      <div class="media-card__content">
        <div class="media-card__meta">
          <strong>${mention.publisher}</strong>
          <span>${mention.date}</span>
        </div>
        <h3>${mention.title}</h3>
        <p>${mention.description}</p>
        <span class="media-card__link">Read article ${Icon('arrow')}</span>
      </div>
    </a>
  `;
}

function renderCarouselDots(items, label) {
  return items.map((_, index) => `
    <button
      class="carousel-dot ${index === 0 ? 'is-active' : ''}"
      type="button"
      data-carousel-dot="${index}"
      aria-label="Go to ${label} ${index + 1}"
      aria-current="${index === 0 ? 'true' : 'false'}"
    ></button>
  `).join('');
}

function renderCarouselToolbar(items, singularLabel) {
  return `
    <div class="carousel-toolbar">
      <div class="carousel-status" data-carousel-counter aria-live="polite">01 / ${String(items.length).padStart(2, '0')}</div>
      <div class="carousel-controls">
        <button type="button" data-carousel-prev aria-label="Previous ${singularLabel}" disabled>${Icon('chevron-left')}</button>
        <button type="button" data-carousel-next aria-label="Next ${singularLabel}">${Icon('chevron-right')}</button>
      </div>
    </div>
  `;
}

function renderActionLink(link) {
  return `
    <a class="research-action ${link.featured ? 'research-action--featured' : ''}" href="${link.href}"${linkAttributes(link.href)}>
      <span>${link.label}</span>
    </a>
  `;
}

function renderStat(stat) {
  return `
    <div class="research-stat">
      ${Icon(stat.icon)}
      <strong>${stat.value}</strong>
      <span>${stat.label}</span>
    </div>
  `;
}

export function ResearchSection({ header, publications, openSource, stats, mediaMentions }) {
  const cards = publications.map(renderPublication).join('');
  const mediaCards = mediaMentions.map(renderMediaMention).join('');

  return `
    <section class="research" id="publications">
      <div class="research__inner">
        <header class="research-heading">
          <div>
            <h2>${header.title}</h2>
            <p class="research-heading__description">${header.description}</p>
          </div>
        </header>

        <div class="content-carousel" data-carousel data-carousel-item-label="publication">
          ${renderCarouselToolbar(publications, 'publication')}
          <div class="carousel-track publication-track" data-carousel-track tabindex="0" aria-label="Research publications">
            ${cards}
          </div>
          <div class="carousel-dots" aria-label="Choose publication">${renderCarouselDots(publications, 'publication')}</div>
        </div>

        <div class="research-grid">
          <article class="open-panel">
            <h3>${openSource.title}</h3>
            <div class="research-actions">${openSource.links.map(renderActionLink).join('')}</div>
          </article>
          <div class="stats-panel" aria-label="CAVISE in numbers">${stats.map(renderStat).join('')}</div>
        </div>

        <section class="media-section" aria-labelledby="media-title">
          <div class="media-section__heading">
            <h2 id="media-title">Media Mentions</h2>
          </div>

          <div class="content-carousel" data-carousel data-carousel-item-label="media mention">
            ${renderCarouselToolbar(mediaMentions, 'media mention')}
            <div class="carousel-track media-track" data-carousel-track tabindex="0" aria-label="CAVISE media mentions">
              ${mediaCards}
            </div>
            <div class="carousel-dots" aria-label="Choose media mention">${renderCarouselDots(mediaMentions, 'media mention')}</div>
          </div>
        </section>
      </div>
    </section>
  `;
}
