const {ipcRenderer} = require('electron');

ipcRenderer.on("FromRenderer", function(event, ...args){
    if (args[0] === "scrollToOffset") {
        window.scrollTo(args[1].x, args[1].y);
    } else if (args[0] === "getScrollOffset") {
        ipcRenderer.sendToHost("FromWebView", "setScrollOffset", window.scrollX, window.scrollY);
    }
});
