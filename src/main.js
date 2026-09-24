import './styles/main.css';

import { App } from './components/App.js';
import { createCarousel } from './ui/createCarousel.js';
import { createLoadingController } from './utils/loading.js';

const app = document.querySelector('#app');
app.innerHTML = App();

const loading = createLoadingController(document.querySelector('#loading'));
const destroyCarousels = [...document.querySelectorAll('[data-carousel]')].map(createCarousel);
let scene;
let destroyScrollStory;

async function initializeExperience() {
  const [{ createScrollStory }, { createSimulationScene }] = await Promise.all([
    import('./animation/createScrollStory.js'),
    import('./scene/createSimulationScene.js')
  ]);

  scene = createSimulationScene(document.querySelector('#scene'));
  await scene.ready;
  destroyScrollStory = createScrollStory({ state: scene.state, resizeScene: scene.resize });
  requestAnimationFrame(loading.hide);
}

initializeExperience().catch(error => {
  console.error('CAVISE experience failed to initialize.', error);
  loading.hide();
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    destroyScrollStory?.();
    destroyCarousels.forEach(destroyCarousel => destroyCarousel());
    scene?.destroy();
    loading.destroy();
  });
}
