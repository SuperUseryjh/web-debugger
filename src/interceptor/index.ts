import { Utils } from "../utils/index.js";
import { UIManager } from "../ui/index.js";
import type { XHRContext } from "../types/index.js";

export class Interceptor {
  static init(): void {
    this.interceptXHR();
    this.interceptFetch();
    this.interceptWS();
  }

  private static interceptXHR(): void {
    const originalXHR = window.XMLHttpRequest;

    window.XMLHttpRequest = function () {
      const xhr = new originalXHR();
      const _open = xhr.open;
      const _send = xhr.send;

      xhr.open = function (method: string, url: string | URL) {
        (this as unknown as { _ctx: XHRContext })._ctx = {
          method,
          url: url.toString(),
          time: Utils.getTime(),
          payload: undefined,
        };
        return _open.apply(this, arguments as unknown as Parameters<typeof _open>);
      };

      xhr.send = function (data?: Document | XMLHttpRequestBodyInit | null) {
        const ctx = (this as unknown as { _ctx: XHRContext })._ctx;
        ctx.payload = data ?? "None";

        this.addEventListener("load", () => {
          UIManager.addLog({
            type: "XHR",
            url: ctx.url,
            method: ctx.method,
            time: ctx.time,
            status: this.status,
            payload: ctx.payload ?? "None",
            response: this.responseText,
          });
        });

        return _send.apply(this, arguments as unknown as Parameters<typeof _send>);
      };

      return xhr;
    } as unknown as typeof window.XMLHttpRequest;

    window.XMLHttpRequest.prototype = originalXHR.prototype;
    Object.assign(window.XMLHttpRequest, originalXHR);
  }

  private static interceptFetch(): void {
    const originalFetch = window.fetch;

    window.fetch = function (...args: Parameters<typeof fetch>) {
      const url = args[0] instanceof Request ? args[0].url : args[0].toString();
      const method =
        (args[1] && args[1].method) || (args[0] instanceof Request ? args[0].method : "GET");
      const payload = (args[1] && args[1].body) || "None";
      const time = Utils.getTime();

      return originalFetch
        .apply(this, args)
        .then(async (response) => {
          const clone = response.clone();
          let responseText = "";
          try {
            responseText = await clone.text();
          } catch {
            responseText = "[Binary/Unreadable]";
          }

          UIManager.addLog({
            type: "FETCH",
            url,
            method,
            time,
            payload,
            status: response.status,
            response: responseText,
          });
          return response;
        })
        .catch((err: Error) => {
          UIManager.addLog({
            type: "FETCH",
            url,
            method,
            time,
            payload,
            status: "ERR",
            response: err.message,
          });
          throw err;
        });
    };
  }

  private static interceptWS(): void {
    const OriginalWebSocket = window.WebSocket;

    const ProxiedWebSocket = function (url: string | URL, protocols?: string | string[]) {
      const ws = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);
      const time = Utils.getTime();
      const urlStr = url.toString();

      UIManager.addLog({
        type: "WS",
        url: urlStr,
        time,
        status: "OPENING",
        payload: "Handshake Initiated",
        response: "Connection Pending...",
      });

      const originalSend = ws.send;
      ws.send = function (data: string | ArrayBuffer | Blob | ArrayBufferView) {
        UIManager.addLog({
          type: "WS",
          url: urlStr,
          time: Utils.getTime(),
          method: "SEND",
          status: "SENT",
          payload: data,
          response: "[Message Sent]",
        });
        return originalSend.apply(this, arguments as unknown as Parameters<typeof originalSend>);
      };

      ws.addEventListener("message", function (e) {
        UIManager.addLog({
          type: "WS",
          url: urlStr,
          time: Utils.getTime(),
          method: "RECV",
          status: "RECEIVED",
          payload: "[Message Received]",
          response: e.data,
        });
      });

      ws.addEventListener("close", function () {
        UIManager.addLog({
          type: "WS",
          url: urlStr,
          time: Utils.getTime(),
          method: "CLOSE",
          status: "CLOSED",
          payload: "Connection Terminated",
          response: "Closed",
        });
      });

      return ws;
    };

    ProxiedWebSocket.prototype = OriginalWebSocket.prototype;
    ProxiedWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    ProxiedWebSocket.OPEN = OriginalWebSocket.OPEN;
    ProxiedWebSocket.CLOSING = OriginalWebSocket.CLOSING;
    ProxiedWebSocket.CLOSED = OriginalWebSocket.CLOSED;

    window.WebSocket = ProxiedWebSocket as unknown as typeof window.WebSocket;
  }
}
