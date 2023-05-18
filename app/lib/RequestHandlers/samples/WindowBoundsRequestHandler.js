const {
    NAV_LOAD, NAV_RELOAD, NAV_BACK, NAV_FORWARD, NAV_INTERNAL,
    REQ_ERROR, REQ_NONE, REQ_CONTINUE, REQ_ALLOW, REQ_DENY
} = require("../RequestHandlerConsts.js");
const { app } = require("electron");

/**
 * This is a sample request handler which demonstrates how additional URL parameters can be used as
 * some kind of simple command line switches for window placement. If BareBrowser opens a URL like
 * 
 * https://github.com/idesis-gmbh/BareBrowser?_wbx=100&_wby=100&_wbw=800&_wbh=800
 * 
 * this handler will look for certain URL parameters (_wbx, _wby, _wbw, _wbh), take their values and
 * remove them from the initial URL. Then it will try to set window bounds according to the URL
 * parameters.\
 * Don't forget to always remove additional URL parameters which have no meaning for or may cause
 * errors in the called website!
 */
class WindowBoundsRequestHandler {

    constructor(config, settings, active, webContents, browserWindow) {
        this.className = this.constructor.name;
        this.settings = settings;
        this.browserWindow = browserWindow;
        this.winId = this.browserWindow.id;
        this.baseURL = "";
        console.log(`${this.className} (${this.winId}): Instance created (Active=${active})`);
    }

    handleRequest(urlObj, originalURL, navType) {
        if (navType === NAV_LOAD) {
            const url = new URL(urlObj.URL);
            // Get desired window bounds from URL parameters. Every value is optional, see below.
            const x = parseInt(url.searchParams.get("_wbx"));
            const y = parseInt(url.searchParams.get("_wby"));
            const w = parseInt(url.searchParams.get("_wbw"));
            const h = parseInt(url.searchParams.get("_wbh"));
            const setFocus = url.searchParams.has("_setFocus");
            // Avoid passing forward these special URL parameters since they could cause problems in
            // the called website!
            url.searchParams.delete("_wbx");
            url.searchParams.delete("_wby");
            url.searchParams.delete("_wbw");
            url.searchParams.delete("_wbh");
            url.searchParams.delete("_setFocus");
            // Reassign URL to be opened without special URL parameters.
            urlObj.URL = url.toString();
            // Set new window bounds. For missing values the existing ones from the current bounds
            // are used.
            const bounds = this.browserWindow.getBounds();
            bounds.x = isNaN(x) ? bounds.x : x;
            bounds.y = isNaN(y) ? bounds.y : y;
            bounds.width = isNaN(w) ? bounds.width : w;
            bounds.height = isNaN(h) ? bounds.height : h;
            this.log("Setting new window bounds:", bounds);
            this.browserWindow.setBounds(bounds);
            if (setFocus) {
                app.focus({ steal: true });
                this.browserWindow.focus();
            }
        }
        return REQ_CONTINUE;
    }

    log(msg, error) {
        if (error) {
            console.error(`${this.className} (${this.winId}): ${msg}\n`, error);
        } else {
            console.log(`${this.className} (${this.winId}): ${msg}`);
        }
    }

    dispose() {
        this.settings = undefined;
        this.browserWindow = undefined;
    }
}

module.exports = WindowBoundsRequestHandler;
