import { JSDOM } from "jsdom"

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" })
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "Element", "Node", "MutationObserver", "getComputedStyle"] as const) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
}
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, requestAnimationFrame: (fn: FrameRequestCallback) => setTimeout(fn, 0), cancelAnimationFrame: clearTimeout })
