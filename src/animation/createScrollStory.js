import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CAMERA_STAGES = [
  {
    cameraX: -1.1,
    cameraY: 6.8,
    cameraZ: 14.2,
    cameraTargetX: 0.2,
    cameraTargetY: 0.7,
    cameraTargetZ: -29,
    cameraRoll: -0.008
  },
  {
    cameraX: -4.2,
    cameraY: 5.1,
    cameraZ: 10.4,
    cameraTargetX: -0.8,
    cameraTargetY: 0.85,
    cameraTargetZ: -30,
    cameraRoll: 0.014,
    worldX: 0.65,
    worldRotY: 0.026
  },
  {
    cameraX: 4,
    cameraY: 6.4,
    cameraZ: 11.8,
    cameraTargetX: 0.9,
    cameraTargetY: 0.7,
    cameraTargetZ: -32,
    cameraRoll: -0.014,
    worldX: -0.7,
    worldRotY: -0.045
  },
  {
    cameraX: 0,
    cameraY: 4.5,
    cameraZ: 7.4,
    cameraTargetX: 0,
    cameraTargetY: 0.95,
    cameraTargetZ: -34,
    cameraRoll: 0,
    worldX: 0,
    worldRotY: 0
  }
];

export function createScrollStory({ state, resizeScene }) {
  const copies = [...document.querySelectorAll('.step-copy')];
  const navButtons = [...document.querySelectorAll('.progress-nav button')];
  const counterText = document.querySelector('#counterText');
  const stageCount = copies.length;
  const totalSegments = stageCount + 1;
  const usesTouchNavigation = navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  let currentStep = -2;

  if (usesTouchNavigation) {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  function getStepFromProgress(progress) {
    const storyTime = Math.min(totalSegments, Math.max(0, progress * totalSegments));
    if (storyTime < 0.58) return -1;
    return Math.min(stageCount - 1, Math.max(0, Math.round(storyTime - 1)));
  }

  function setActiveStep(progress) {
    const storyTime = Math.min(totalSegments, Math.max(0, progress * totalSegments));
    const stepPosition = storyTime - 1;
    const rawStep = Math.min(stageCount - 1, Math.max(0, stepPosition));
    const activeIndex = getStepFromProgress(progress);

    if (activeIndex !== currentStep) {
      currentStep = activeIndex;
      navButtons.forEach((button, index) => {
        const isActive = index === activeIndex;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-current', isActive ? 'step' : 'false');
      });
      if (activeIndex >= 0) {
        counterText.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(stageCount).padStart(2, '0')}`;
      }
    }

    const stageEntrance = gsap.utils.clamp(0, 1, (storyTime - 0.58) / 0.42);
    copies.forEach((element, index) => {
      const distance = Math.abs(index - rawStep);
      const opacity = stageEntrance * Math.max(0, 1 - distance * 1.55);
      element.style.opacity = opacity.toFixed(3);
      element.style.transform = `translateY(${(index - rawStep) * 30}px)`;
      element.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
    });
  }

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#scrollSection',
      start: 'top top',
      end: () => {
        const segmentDistance = usesTouchNavigation
          ? Math.max(640, Math.min(820, window.innerHeight))
          : 1040;
        return `+=${totalSegments * segmentDistance}`;
      },
      pin: '#stage',
      scrub: 0.55,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: self => setActiveStep(self.progress)
    }
  });

  // The first segment transforms the product hero into the simulation stage;
  // the following four segments remain the four simulation layers.
  const timelineClock = { progress: 0 };
  timeline.to(timelineClock, { progress: 1, duration: totalSegments }, 0);

  timeline
    .to('#heroLayer', {
      autoAlpha: 0,
      yPercent: -8,
      duration: 0.78,
      ease: 'sine.inOut'
    }, 0.06)
    .to('#sceneViewport', {
      autoAlpha: 1,
      clipPath: 'inset(0% 0% 0% 0% round 0px)',
      scale: 1,
      duration: 1,
      ease: 'sine.inOut'
    }, 0)
    .to('.stage-ui', {
      autoAlpha: 1,
      duration: 0.42,
      ease: 'sine.out'
    }, 0.58)
    .to(state, {
      ...CAMERA_STAGES[0],
      worldReveal: 1,
      duration: 1,
      ease: 'sine.inOut'
    }, 0);

  // Camera positions remain exact slide anchors after the hero transition.
  CAMERA_STAGES.slice(1).forEach((cameraStage, index) => {
    timeline.to(state, {
      ...cameraStage,
      duration: 1,
      ease: 'sine.inOut'
    }, index + 1);
  });

  // Wireless and integrated layers finish their transitions at the same
  // boundaries as their corresponding slides.
  timeline
    .to(state, {
      radio: 1,
      v2x: 0,
      integrated: 0,
      syncWave: 0,
      duration: 0.45,
      ease: 'sine.inOut'
    }, 2.55)
    .to(state, {
      radio: 0.68,
      v2x: 1,
      integrated: 1,
      syncWave: 1,
      duration: 0.45,
      ease: 'sine.inOut'
    }, 3.55);

  // Perception overlays belong to slide two: they are fully visible at its
  // beginning and fade out before slide three becomes active.
  timeline
    .to(state, { lidar: 0.98, detect: 1, duration: 0.38 }, 1.62)
    .to(state, { lidar: 0, detect: 0, duration: 0.38 }, 2.5);

  // The fully connected graph belongs only to slide three.
  timeline
    .to(state, { wirelessGraph: 1, duration: 0.38 }, 2.62)
    .to(state, { wirelessGraph: 0, duration: 0.38 }, 3.5);

  let scrollTween;
  let wheelAccumulator = 0;
  let wheelResetTimer = 0;
  let unlockTimer = 0;
  let isStepScrolling = false;
  let requestedStep = -1;
  let touchStartX = 0;
  let touchStartY = 0;
  let isTrackingTouch = false;
  const touchpadThreshold = 10;
  const wheelThreshold = 20;
  const touchThreshold = 34;

  function isInsideStory() {
    const scrollTrigger = timeline.scrollTrigger;
    if (!scrollTrigger) return false;

    const scrollPosition = window.scrollY;
    return scrollPosition >= scrollTrigger.start - 1
      && scrollPosition <= scrollTrigger.end + 1;
  }

  function scheduleStepUnlock() {
    window.clearTimeout(unlockTimer);
    unlockTimer = window.setTimeout(() => {
      if (scrollTween) {
        scheduleStepUnlock();
        return;
      }
      isStepScrolling = false;
    }, 180);
  }

  function getStepTarget(stepIndex) {
    const scrollTrigger = timeline.scrollTrigger;
    if (!scrollTrigger) return window.scrollY;

    if (stepIndex < 0) return scrollTrigger.start;
    if (stepIndex >= stageCount) return scrollTrigger.end + 2;

    const progress = (stepIndex + 1) / totalSegments;
    return scrollTrigger.start + (scrollTrigger.end - scrollTrigger.start) * progress;
  }

  function scrollToStep(stepIndex) {
    const scrollTrigger = timeline.scrollTrigger;
    if (!scrollTrigger) return false;

    const nextStep = Math.max(-1, Math.min(stepIndex, stageCount));
    if (nextStep === requestedStep && isStepScrolling) return false;

    const target = getStepTarget(nextStep);

    scrollTween?.kill();
    requestedStep = nextStep;
    isStepScrolling = true;
    const scrollPosition = { top: window.scrollY };

    scrollTween = gsap.to(scrollPosition, {
      top: target,
      duration: usesTouchNavigation ? 1.05 : 1.28,
      ease: 'sine.inOut',
      overwrite: true,
      onUpdate: () => window.scrollTo(0, scrollPosition.top),
      onComplete: () => {
        scrollTween = null;
        scheduleStepUnlock();
      },
      onInterrupt: () => {
        scrollTween = null;
        isStepScrolling = false;
      }
    });

    return true;
  }

  function canMoveInDirection(direction) {
    const baseStep = isStepScrolling ? requestedStep : currentStep;
    return direction > 0 ? baseStep < stageCount : baseStep > -1;
  }

  function moveInDirection(direction) {
    const baseStep = isStepScrolling ? requestedStep : currentStep;
    return scrollToStep(baseStep + direction);
  }

  function handleWheel(event) {
    const scrollTrigger = timeline.scrollTrigger;
    if (!scrollTrigger) return;

    if (isStepScrolling) {
      event.preventDefault();
      scheduleStepUnlock();
      return;
    }

    if (!isInsideStory()) return;

    event.preventDefault();
    const deltaMultiplier = event.deltaMode === 1
      ? 16
      : event.deltaMode === 2
        ? window.innerHeight
        : 1;
    const delta = event.deltaY * deltaMultiplier;
    if (!delta) return;

    if (wheelAccumulator && Math.sign(wheelAccumulator) !== Math.sign(delta)) {
      wheelAccumulator = 0;
    }
    wheelAccumulator += delta;

    window.clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => {
      wheelAccumulator = 0;
    }, 220);

    const activationThreshold = event.deltaMode === 0
      ? touchpadThreshold
      : wheelThreshold;
    if (Math.abs(wheelAccumulator) < activationThreshold) return;

    const direction = Math.sign(wheelAccumulator);
    wheelAccumulator = 0;
    if (!canMoveInDirection(direction)) return;
    moveInDirection(direction);
  }

  function handleTouchStart(event) {
    if (event.touches.length !== 1 || !isInsideStory()) {
      isTrackingTouch = false;
      return;
    }

    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isTrackingTouch = true;
  }

  function handleTouchMove(event) {
    if (!isTrackingTouch || event.touches.length !== 1 || !isInsideStory()) return;

    const touch = event.touches[0];
    const deltaX = touchStartX - touch.clientX;
    const deltaY = touchStartY - touch.clientY;
    if (Math.abs(deltaY) < touchThreshold || Math.abs(deltaY) <= Math.abs(deltaX)) return;

    const direction = Math.sign(deltaY);
    if (!canMoveInDirection(direction)) {
      isTrackingTouch = false;
      return;
    }

    event.preventDefault();
    if (!isStepScrolling) moveInDirection(direction);
    isTrackingTouch = false;
  }

  function handleTouchEnd() {
    isTrackingTouch = false;
  }

  function alignRestoredScrollPosition() {
    const scrollTrigger = timeline.scrollTrigger;
    if (!scrollTrigger || !isInsideStory()) return;

    const restoredProgress = gsap.utils.clamp(0, 1, scrollTrigger.progress);
    const nearestAnchor = Math.round(restoredProgress * totalSegments);
    const nearestStep = Math.max(-1, Math.min(nearestAnchor - 1, stageCount));
    const anchorProgress = nearestStep < 0
      ? 0
      : Math.min(1, (nearestStep + 1) / totalSegments);

    requestedStep = nearestStep;
    isStepScrolling = false;
    window.scrollTo(0, getStepTarget(nearestStep));
    ScrollTrigger.update();
    setActiveStep(anchorProgress);
  }

  const navigationHandlers = navButtons.map((button, index) => {
    const handler = () => scrollToStep(index);
    button.addEventListener('click', handler);
    return handler;
  });

  let resizeFrame = 0;
  let initializationFrame = 0;
  let previousViewportWidth = window.innerWidth;
  const handleResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeScene();
      const widthChanged = Math.abs(window.innerWidth - previousViewportWidth) > 3;
      if (!usesTouchNavigation || widthChanged) ScrollTrigger.refresh();
      previousViewportWidth = window.innerWidth;
    });
  };
  window.addEventListener('resize', handleResize, { passive: true });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    timeline.scrollTrigger?.kill();
    gsap.set('#stage', { clearProps: 'all' });
    setActiveStep(0);
  } else {
    setActiveStep(0);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    initializationFrame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      initializationFrame = requestAnimationFrame(alignRestoredScrollPosition);
    });
  }

  return function destroyScrollStory() {
    cancelAnimationFrame(resizeFrame);
    cancelAnimationFrame(initializationFrame);
    window.clearTimeout(wheelResetTimer);
    window.clearTimeout(unlockTimer);
    scrollTween?.kill();
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('touchcancel', handleTouchEnd);
    navButtons.forEach((button, index) => {
      button.removeEventListener('click', navigationHandlers[index]);
    });
    timeline.scrollTrigger?.kill();
    timeline.kill();
  };
}
