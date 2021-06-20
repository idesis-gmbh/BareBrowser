import { ipcRenderer } from "electron";
import { Point } from "electron/main";
import { IPC, IPC_WEBVIEW_RENDERER } from "../shared/IPC";

/**
 * Communication between the webview tag and the browseer window.
 */
ipcRenderer.on(IPC_WEBVIEW_RENDERER, function (_event: Electron.IpcRendererEvent, ...args: unknown[]) {
    if (args[0] === IPC.SCROLL_TO_OFFSET) {
        // Scroll window to (former) offset to enable proper reload behaviour.
        const point = args[1] as Point;
        window.scrollTo(point.x, point.y);
    } else if (args[0] === IPC.GET_SCROLL_OFFSET) {
        // Queried by the browser window. The browser window will store
        // the current scroll offset to enable proper reload behaviour.
        ipcRenderer.sendToHost(IPC_WEBVIEW_RENDERER, IPC.SET_SCROLL_OFFSET, window.scrollX, window.scrollY);
    }
});


/**
 * Send a keyboard event to the host window.
 * @param t Name of the keyboard event (keypress, keydown or keyup)
 * @param e A keyboard event.
 */
function handleKBevent(t: string, e: KeyboardEvent) {
    const kbEvent = {
        /* eslint-disable jsdoc/require-jsdoc */
        type: t,
        dict: {
            altKey: e.altKey,
            // charCode: e.charCode,
            // code: e.code,
            ctrlKey: e.ctrlKey,
            isComposing: e.isComposing,
            key: e.key,
            keyCode: e.keyCode,
            // location: e.location,
            metaKey: e.metaKey,
            repeat: e.repeat,
            shiftKey: e.shiftKey,
            // which: e.which
        }
        /* eslint-enable */
    };
    try {
        // Notify the browser window with every keyboard event inside the web view.
        ipcRenderer.sendToHost(IPC_WEBVIEW_RENDERER, IPC.KEYBOARD_EVENT, kbEvent);
    } catch (error) {
        console.log(error);
    }
}

/* eslint-disable jsdoc/require-jsdoc */
// window.addEventListener("keypress", (e) => { handleKBevent("keypress", e); }, {capture: true, passive: true});
window.addEventListener("keydown", (e) => { handleKBevent("keydown", e); }, { capture: true, passive: true });
window.addEventListener("keyup", (e) => { handleKBevent("keyup", e); }, { capture: true, passive: true });
/* eslint-enable */
