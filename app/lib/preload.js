const { ipcRenderer } = require("electron");

/**
 * Communication between the webview tag and the browseer window.
 */
ipcRenderer.on("IPCFromRenderer", function (event, ...args) {
    if (args[0] === "scrollToOffset") {
        // Scroll window to (former) offset to enable proper reload behaviour.
        window.scrollTo(args[1].x, args[1].y);
    } else if (args[0] === "getScrollOffset") {
        // Queried by the browser window. The browser window will store
        // the current scroll offset to enable proper reload behaviour.
        ipcRenderer.sendToHost("IPCFromWebView", "setScrollOffset", window.scrollX, window.scrollY);
    }
});

let __PreloadKBHandler = {};
(function (__PreloadKBHandler) {

    let handleKBevent = function (t, e) {
        const kbEvent = {
            type: t,
            dict: {
                key: e.key,
                code: e.ctrlKey,
                location: e.location,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey,
                repeat: e.repeat,
                isComposing: e.isComposing,
                charCode: e.charCode,
                keyCode: e.keyCode,
                which: e.which
            }
        };
        try {
            // Notify the browser window with every keyboard event inside the web view.
            ipcRenderer.sendToHost("IPCFromWebView", "keyboardEvent", kbEvent);
        } catch (error) {
            console.log(error);
        }
    }

    document.addEventListener("keypress", (e) => { handleKBevent("keypress", e); });
    document.addEventListener("keydown", (e) => { handleKBevent("keydown", e); });
    document.addEventListener("keyup", (e) => { handleKBevent("keyup", e); });

})(__PreloadKBHandler);
