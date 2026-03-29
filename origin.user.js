// ==UserScript==
// @name         现代化网络请求调试助手
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  现代化 UI 设计，模块化拦截逻辑，支持 Fetch/XHR/WebSocket 深度监控
// @author       YaoOnion
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ================= 配置与常量 =================
    const CONFIG = {
        MAX_LOGS: 300,
        PANEL_WIDTH: '550px',
        PANEL_HEIGHT: '500px',
        THEME: {
            bg: 'rgba(18, 18, 18, 0.92)',
            border: '#333',
            accent: '#3498db',
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f1c40f',
            text: '#e0e0e0',
            textDim: '#888'
        }
    };

    // ================= 辅助工具模块 =================
    const Utils = {
        formatJSON(data) {
            if (!data) return 'None';
            try {
                const obj = typeof data === 'string' ? JSON.parse(data) : data;
                return JSON.stringify(obj, null, 2);
            } catch (e) {
                return String(data);
            }
        },
        getTime() {
            return new Date().toLocaleTimeString(undefined, { hour12: false, fractionalSecondDigits: 3 });
        },
        safeClone(obj) {
            try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; }
        }
    };

    // ================= UI 管理模块 =================
    const UIManager = {
        panel: null,
        content: null,
        ball: null,
        isMinimized: false,

        init() {
            this.injectStyles();
            this.createElements();
            this.setupEvents();
        },

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                #net-dbg-root { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: ${CONFIG.THEME.text}; }
                #net-dbg-panel {
                    position: fixed; top: 20px; right: 20px;
                    width: ${CONFIG.PANEL_WIDTH}; height: ${CONFIG.PANEL_HEIGHT};
                    background: ${CONFIG.THEME.bg};
                    backdrop-filter: blur(12px);
                    border: 1px solid ${CONFIG.THEME.border};
                    border-radius: 12px;
                    z-index: 2147483647;
                    display: flex; flex-direction: column;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
                    overflow: hidden; pointer-events: auto;
                    transition: opacity 0.2s;
                }
                #net-dbg-header {
                    padding: 12px 16px; background: rgba(255,255,255,0.03);
                    border-bottom: 1px solid ${CONFIG.THEME.border};
                    display: flex; justify-content: space-between; align-items: center;
                    cursor: move; user-select: none;
                }
                #net-dbg-header h3 { margin: 0; font-size: 13px; font-weight: 600; color: ${CONFIG.THEME.accent}; }
                #net-dbg-content { flex: 1; overflow-y: auto; padding: 4px; }
                
                .log-entry {
                    margin-bottom: 2px; border-radius: 4px; overflow: hidden;
                    border-left: 3px solid transparent; transition: background 0.2s;
                    background: rgba(255,255,255,0.02);
                }
                .log-entry:hover { background: rgba(255,255,255,0.06); }
                .log-summary { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; font-size: 12px; gap: 8px; }
                .log-type { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #333; }
                .log-method { font-weight: bold; min-width: 45px; }
                .log-url { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #bbb; }
                .log-status { font-weight: bold; }
                
                .status-2xx { color: ${CONFIG.THEME.success}; }
                .status-4xx { color: ${CONFIG.THEME.warning}; }
                .status-5xx { color: ${CONFIG.THEME.error}; }
                .type-ws { color: #f39c12; }
                .type-fetch { color: #9b59b6; }
                .type-xhr { color: #3498db; }

                .log-detail {
                    display: none; padding: 12px; background: rgba(0,0,0,0.3);
                    border-top: 1px solid ${CONFIG.THEME.border}; font-family: 'Consolas', monospace;
                }
                .log-entry.expanded { border-left-color: ${CONFIG.THEME.accent}; background: rgba(255,255,255,0.05); }
                .log-entry.expanded .log-detail { display: block; }
                .detail-section { margin-bottom: 12px; }
                .detail-title { font-size: 11px; color: ${CONFIG.THEME.textDim}; text-transform: uppercase; margin-bottom: 4px; font-weight: bold; border-bottom: 1px solid #222; }
                .detail-body { white-space: pre-wrap; word-break: break-all; color: #ccc; max-height: 250px; overflow-y: auto; background: #0a0a0a; padding: 8px; border-radius: 4px; }

                #net-dbg-ball {
                    position: fixed; top: 20px; right: 20px;
                    width: 48px; height: 48px; background: ${CONFIG.THEME.accent};
                    border-radius: 50%; z-index: 2147483647;
                    display: none; align-items: center; justify-content: center;
                    cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                    transition: transform 0.2s; border: 2px solid rgba(255,255,255,0.2);
                }
                #net-dbg-ball:hover { transform: scale(1.1); }
                #net-dbg-ball-count { color: white; font-size: 12px; font-weight: bold; }

                .dbg-btn {
                    background: transparent; border: 1px solid #444; color: #ccc;
                    padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px;
                    transition: all 0.2s;
                }
                .dbg-btn:hover { background: #333; color: white; border-color: #666; }
            `;
            document.head.appendChild(style);
        },

        createElements() {
            const root = document.createElement('div');
            root.id = 'net-dbg-root';

            root.innerHTML = `
                <div id="net-dbg-panel">
                    <div id="net-dbg-header">
                        <h3>NETWORK MONITOR</h3>
                        <div style="display:flex; gap:8px;">
                            <button class="dbg-btn" id="btn-clear">Clear</button>
                            <button class="dbg-btn" id="btn-min">Minimize</button>
                        </div>
                    </div>
                    <div id="net-dbg-content"></div>
                </div>
                <div id="net-dbg-ball">
                    <div id="net-dbg-ball-count">0</div>
                </div>
            `;
            (document.body || document.documentElement).appendChild(root);
            
            this.panel = document.getElementById('net-dbg-panel');
            this.content = document.getElementById('net-dbg-content');
            this.ball = document.getElementById('net-dbg-ball');
        },

        setupEvents() {
            document.getElementById('btn-clear').onclick = () => {
                this.content.innerHTML = '';
                this.updateCount();
            };
            document.getElementById('btn-min').onclick = () => this.toggleMinimize(true);
            this.ball.onclick = () => {
                if (!this.ball.dataset.dragging) this.toggleMinimize(false);
            };

            this.makeDraggable(this.panel, '#net-dbg-header');
            this.makeDraggable(this.ball);
        },

        toggleMinimize(min) {
            this.isMinimized = min;
            if (min) {
                this.ball.style.top = this.panel.style.top;
                this.ball.style.left = this.panel.style.left;
                this.panel.style.setProperty('display', 'none', 'important');
                this.ball.style.setProperty('display', 'flex', 'important');
            } else {
                this.panel.style.top = this.ball.style.top;
                this.panel.style.left = this.ball.style.left;
                this.panel.style.setProperty('display', 'flex', 'important');
                this.ball.style.setProperty('display', 'none', 'important');
            }
        },

        makeDraggable(el, handleSelector) {
            let startX, startY, initialX, initialY;
            let isDragging = false;
            const handle = handleSelector ? el.querySelector(handleSelector) : el;

            const onMouseDown = (e) => {
                isDragging = true;
                el.dataset.dragging = '';
                startX = e.clientX;
                startY = e.clientY;
                initialX = el.offsetLeft;
                initialY = el.offsetTop;
                el.style.right = 'auto';
                
                window.addEventListener('mousemove', onMouseMove, { passive: false });
                window.addEventListener('mouseup', onMouseUp);
                e.preventDefault();
                e.stopPropagation();
            };

            const onMouseMove = (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    el.dataset.dragging = 'true';
                }
                
                el.style.setProperty('left', (initialX + dx) + 'px', 'important');
                el.style.setProperty('top', (initialY + dy) + 'px', 'important');
                e.preventDefault();
            };

            const onMouseUp = () => {
                isDragging = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                setTimeout(() => {
                    el.removeAttribute('data-dragging');
                }, 50);
            };

            handle.addEventListener('mousedown', onMouseDown);
        },

        addLog(data) {
            if (!this.content) return;
            const entry = document.createElement('div');
            entry.className = `log-entry type-${data.type.toLowerCase()}`;
            
            const statusClass = data.status >= 500 ? 'status-5xx' : (data.status >= 400 ? 'status-4xx' : 'status-2xx');
            
            entry.innerHTML = `
                <div class="log-summary">
                    <span class="log-type type-${data.type.toLowerCase()}">${data.type}</span>
                    <span class="log-method">${data.method || 'WS'}</span>
                    <span class="log-url" title="${data.url}">${data.url}</span>
                    <span class="log-status ${statusClass}">${data.status || '--'}</span>
                </div>
                <div class="log-detail">
                    <div class="detail-section">
                        <div class="detail-title">General</div>
                        <div class="detail-body">Time: ${data.time}\nURL: ${data.url}\nMethod: ${data.method || 'WebSocket'}</div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">Request Payload</div>
                        <div class="detail-body">${Utils.formatJSON(data.payload)}</div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">Response Content</div>
                        <div class="detail-body">${Utils.formatJSON(data.response)}</div>
                    </div>
                </div>
            `;

            entry.onclick = () => entry.classList.toggle('expanded');
            this.content.appendChild(entry);
            
            if (!this.isMinimized) this.content.scrollTop = this.content.scrollHeight;
            if (this.content.childNodes.length > CONFIG.MAX_LOGS) this.content.removeChild(this.content.firstChild);
            this.updateCount();
        },

        updateCount() {
            const count = this.content.childNodes.length;
            if (this.ball) {
                const countEl = document.getElementById('net-dbg-ball-count');
                if (countEl) countEl.innerText = count;
            }
        }
    };

    // ================= 拦截器模块 =================
    const Interceptor = {
        init() {
            this.interceptXHR();
            this.interceptFetch();
            this.interceptWS();
        },

        interceptXHR() {
            const originalXHR = window.XMLHttpRequest;
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const _open = xhr.open;
                const _send = xhr.send;

                xhr.open = function(method, url) {
                    this._ctx = { method, url, time: Utils.getTime() };
                    return _open.apply(this, arguments);
                };

                xhr.send = function(data) {
                    this._ctx.payload = data;
                    this.addEventListener('load', () => {
                        UIManager.addLog({
                            type: 'XHR',
                            ...this._ctx,
                            status: this.status,
                            response: this.responseText
                        });
                    });
                    return _send.apply(this, arguments);
                };
                return xhr;
            };
            window.XMLHttpRequest.prototype = originalXHR.prototype;
            Object.assign(window.XMLHttpRequest, originalXHR);
        },

        interceptFetch() {
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const url = args[0] instanceof Request ? args[0].url : args[0];
                const method = (args[1] && args[1].method) || (args[0] instanceof Request ? args[0].method : 'GET');
                const payload = (args[1] && args[1].body) || 'None';
                const time = Utils.getTime();

                return originalFetch.apply(this, args).then(async response => {
                    const clone = response.clone();
                    let responseText = '';
                    try { responseText = await clone.text(); } catch { responseText = '[Binary/Unreadable]'; }
                    
                    UIManager.addLog({
                        type: 'FETCH',
                        url, method, time, payload,
                        status: response.status,
                        response: responseText
                    });
                    return response;
                }).catch(err => {
                    UIManager.addLog({
                        type: 'FETCH',
                        url, method, time, payload,
                        status: 'ERR',
                        response: err.message
                    });
                    throw err;
                });
            };
        },

        interceptWS() {
            const OriginalWebSocket = window.WebSocket;
            
            // 使用传统重写方式代替 Proxy，以提高兼容性
            const ProxiedWebSocket = function(url, protocols) {
                const ws = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);
                const time = Utils.getTime();

                UIManager.addLog({ 
                    type: 'WS', 
                    url, 
                    time, 
                    status: 'OPENING', 
                    payload: 'Handshake Initiated', 
                    response: 'Connection Pending...' 
                });

                // 劫持 send 方法
                const originalSend = ws.send;
                ws.send = function(data) {
                    UIManager.addLog({ 
                        type: 'WS', 
                        url, 
                        time: Utils.getTime(), 
                        method: 'SEND', 
                        payload: data, 
                        response: '[Message Sent]' 
                    });
                    return originalSend.apply(this, arguments);
                };

                // 劫持事件监听器
                ws.addEventListener('message', function(e) {
                    UIManager.addLog({ 
                        type: 'WS', 
                        url, 
                        time: Utils.getTime(), 
                        method: 'RECV', 
                        payload: '[Message Received]', 
                        response: e.data 
                    });
                });

                ws.addEventListener('close', function() {
                    UIManager.addLog({ 
                        type: 'WS', 
                        url, 
                        time: Utils.getTime(), 
                        method: 'CLOSE', 
                        payload: 'Connection Terminated', 
                        response: 'Closed' 
                    });
                });

                return ws;
            };

            // 保持原型链一致
            ProxiedWebSocket.prototype = OriginalWebSocket.prototype;
            ProxiedWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
            ProxiedWebSocket.OPEN = OriginalWebSocket.OPEN;
            ProxiedWebSocket.CLOSING = OriginalWebSocket.CLOSING;
            ProxiedWebSocket.CLOSED = OriginalWebSocket.CLOSED;

            window.WebSocket = ProxiedWebSocket;
        }
    };

    // ================= 启动 =================
    const init = () => {
        if (window._NET_DEBUGGER_INIT) return;
        window._NET_DEBUGGER_INIT = true;
        UIManager.init();
        Interceptor.init();
    };

    // 尽量提早运行
    if (document.body) init();
    else {
        const obs = new MutationObserver(() => {
            if (document.body) {
                init();
                obs.disconnect();
            }
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
    }

})();