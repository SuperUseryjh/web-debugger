import { UIManager } from "./ui/index.js";
import { Interceptor } from "./interceptor/index.js";

const init = (): void => {
  if (window._NET_DEBUGGER_INIT) return;
  window._NET_DEBUGGER_INIT = true;
  UIManager.init();
  Interceptor.init();
};

if (document.body) {
  init();
} else {
  const obs = new MutationObserver(() => {
    if (document.body) {
      init();
      obs.disconnect();
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
}

declare global {
  interface Window {
    _NET_DEBUGGER_INIT?: boolean;
  }
}
