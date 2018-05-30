const {ipcRenderer} = require('electron');

/**
 * Communication between the webview tag and the browseer window.
 */

ipcRenderer.on("FromRenderer", function(event, ...args){
    if (args[0] === "scrollToOffset") {
        // Scroll window to (former) offset to enable proper reload behaviour.
        window.scrollTo(args[1].x, args[1].y);
    } else if (args[0] === "getScrollOffset") {
        // Queried by the browser window. The browser window will store 
        // the current scroll offset to enable proper reload behaviour.
        ipcRenderer.sendToHost("FromWebView", "setScrollOffset", window.scrollX, window.scrollY);
    }
});
