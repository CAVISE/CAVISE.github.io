export function createLoadingController(element) {
  function hide() {
    element?.classList.add('hidden');
  }

  return {
    hide,
    destroy() {}
  };
}
