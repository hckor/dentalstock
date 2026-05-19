import '@testing-library/jest-dom';

// jsdom 환경에서 PWA standalone 감지 코드가 깨지지 않도록 matchMedia 폴리필
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
