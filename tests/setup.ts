import '@testing-library/jest-dom/vitest'

// jsdom kennt weder die Web Animations API (Svelte-Übergänge) noch matchMedia.
if (!Element.prototype.animate) {
  Element.prototype.animate = function () {
    const animation = {
      onfinish: null as null | (() => void),
      cancel() {},
      finish() {},
      currentTime: 0,
      finished: Promise.resolve(),
    }
    setTimeout(() => animation.onfinish?.(), 0)
    return animation as unknown as Animation
  }
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
