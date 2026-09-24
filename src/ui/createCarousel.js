export function createCarousel(root) {
  if (!root) return () => {};

  const track = root.querySelector('[data-carousel-track]');
  const cards = [...root.querySelectorAll('[data-carousel-card]')];
  const dots = [...root.querySelectorAll('[data-carousel-dot]')];
  const previousButton = root.querySelector('[data-carousel-prev]');
  const nextButton = root.querySelector('[data-carousel-next]');
  const counter = root.querySelector('[data-carousel-counter]');
  const itemLabel = root.dataset.carouselItemLabel || 'item';

  if (!track || cards.length === 0 || !previousButton || !nextButton || !counter) {
    return () => {};
  }

  let activePage = 0;
  let snapTargets = [];
  let scrollFrame = 0;

  const updateControls = page => {
    activePage = Math.max(0, Math.min(page, snapTargets.length - 1));
    const itemIndex = snapTargets[activePage]?.cardIndex ?? 0;
    previousButton.disabled = activePage === 0;
    nextButton.disabled = activePage === snapTargets.length - 1;
    counter.textContent = `${String(itemIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;

    dots.forEach((dot, dotIndex) => {
      const isAvailable = dotIndex < snapTargets.length;
      const isActive = isAvailable && dotIndex === activePage;
      dot.hidden = !isAvailable;
      dot.disabled = !isAvailable;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', String(isActive));
      if (isAvailable) {
        dot.setAttribute('aria-label', `Go to ${itemLabel} ${snapTargets[dotIndex].cardIndex + 1}`);
      }
    });
  };

  const calculateSnapTargets = () => {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const nextTargets = [];

    cards.forEach((card, cardIndex) => {
      const left = Math.min(card.offsetLeft, maxScroll);
      const previousTarget = nextTargets.at(-1);
      if (!previousTarget || Math.abs(previousTarget.left - left) > 2) {
        nextTargets.push({ left, cardIndex });
      }
    });

    if (maxScroll > 2 && nextTargets.length > 1) {
      nextTargets.at(-1).cardIndex = cards.length - 1;
    }

    snapTargets = nextTargets.length ? nextTargets : [{ left: 0, cardIndex: 0 }];
  };

  const goTo = page => {
    const nextPage = Math.max(0, Math.min(page, snapTargets.length - 1));
    updateControls(nextPage);
    track.scrollTo({ left: snapTargets[nextPage].left, behavior: 'smooth' });
  };

  const syncFromScroll = () => {
    scrollFrame = 0;
    const nearestPage = snapTargets.reduce((nearest, target, index) => (
      Math.abs(target.left - track.scrollLeft) < Math.abs(snapTargets[nearest].left - track.scrollLeft)
        ? index
        : nearest
    ), 0);
    updateControls(nearestPage);
  };

  const handleScroll = () => {
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(syncFromScroll);
  };

  const handlePrevious = () => goTo(activePage - 1);
  const handleNext = () => goTo(activePage + 1);
  const handleKeydown = event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    goTo(activePage + (event.key === 'ArrowRight' ? 1 : -1));
  };

  const dotHandlers = dots.map((dot, index) => {
    const handler = () => goTo(index);
    dot.addEventListener('click', handler);
    return handler;
  });

  const handleResize = () => {
    calculateSnapTargets();
    syncFromScroll();
  };

  previousButton.addEventListener('click', handlePrevious);
  nextButton.addEventListener('click', handleNext);
  track.addEventListener('scroll', handleScroll, { passive: true });
  track.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  calculateSnapTargets();
  updateControls(0);

  return () => {
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    previousButton.removeEventListener('click', handlePrevious);
    nextButton.removeEventListener('click', handleNext);
    track.removeEventListener('scroll', handleScroll);
    track.removeEventListener('keydown', handleKeydown);
    dots.forEach((dot, index) => dot.removeEventListener('click', dotHandlers[index]));
    window.removeEventListener('resize', handleResize);
  };
}
