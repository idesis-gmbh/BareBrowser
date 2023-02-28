/**
 * Mandatory.
 * @see RequestHandler.js for an explanation of the imported constants.
 */
const {
    NAV_LOAD, NAV_RELOAD, NAV_BACK, NAV_FORWARD, NAV_INTERNAL,
    REQ_ERROR, REQ_NONE, REQ_CONTINUE, REQ_ALLOW, REQ_DENY
} = require("../RequestHandlerConsts.js");
const { dialog } = require("electron");

/**
 * This is the default request handler which just allows *any* request. If this handler isn't loaded
 * or active (see `settings.json`), BareBrowser won't load anything.
 */
class DefaultRequestHandler {

    /**
     * Mandatory.
     * Request handler constructor.
     * @param {Object} config A configuration for this request handler. Passed in from its own
     * section in `settings.json`. Can be undefined.
     * @param {Object} settings The settings of BareBrowser (`settings.json`). Can be used to
     * override global settings for requests, for example the user agent.
     * @param active {boolean} The handler is configured as active or not in `settings.json`.
     * If active is `false`, the handler won't be called by BareBrowser upon requests.
     * @param {Electron.WebContents} webContents The WebContents associated with the WebView tag
     * in the browser page.
     * @param {Electron.BrowserWindow} browserWindow The Electron browser window which hosts
     * the WebView tag.
     */
    constructor(config, settings, active, webContents, browserWindow) {
        this.className = this.constructor.name; // Store for logging.
        this.config = config;
        this.settings = settings;
        this.webContents = webContents;
        this.browserWindow = browserWindow;
        this.winId = this.browserWindow.id;
        this.webContents.on("will-prevent-unload", this.onUnloadPage.bind(this));
        console.log(`${this.className} (${this.winId}): Instance created with config (Active=${active}): ${JSON.stringify(this.config, 2)}`);
    }

    /**
     * Mandatory.
     * Handle the request for a given URL.
     * @param url {string} The URL of the requested resource.
     * @param originalURL {string} The original URL of the requested resource. On an initial load
     * request this is the raw URL as it was given on the command line. It can be used to bypass the
     * internal auto formatting of URLs which is done with Node.js' `new URL(...)` or to pass
     * arbitrary data to a request handler. In most other cases `url` and `originalURL` are equal.
     * @param navType {number} The type of the request/navigation issued.
     * See `RequestHandlerConsts.js` for possible values.
     * @returns {number} A request result which tells BareBrowser how to proceed with the request.
     * See `RequestHandlerConsts.js` for possible values.
     * 
     * The request/navigation can be issued by
     * - clicking on a link in page which is already loaded,
     * - the page itself, e.g. JavaScript,
     * - through the command line,
     * - through the address bar or
     * - through the back/forward button/keyboard shortcuts.
     * If a handler decides to be responsible for the given URL, it must handle the url
     * appropriately through calling methods on `this.webContents`, see also:
     * https://www.electronjs.org/docs/api/web-contents
     */
    handleRequest(url, originalURL, navType) {
        const logURL = url === originalURL ? url : `${url} (${originalURL})`;
        try {
            if (navType === NAV_LOAD) {
                this.log(`Initial load request ${logURL}`);
            }
            switch (navType) {
                // Just load the URL
                case NAV_LOAD:
                    this.log(`Navigating to ${logURL}`);
                    this.webContents.loadURL(url, { userAgent: this.settings.UserAgent });
                    break;

                // Reload the URL
                case NAV_RELOAD:
                    this.log(`Reloading ${this.webContents.getURL()}`);
                    this.webContents.setUserAgent(this.settings.UserAgent);
                    this.webContents.reload(); // Or better `reloadIgnoringCache()`?
                    break;

                // Go back
                case NAV_BACK:
                    if (this.webContents.canGoBack()) {
                        this.log("Going back");
                        this.webContents.goBack();
                    }
                    break;

                // Go forward
                case NAV_FORWARD:
                    if (this.webContents.canGoForward()) {
                        this.log("Going forward");
                        this.webContents.goForward();
                    }
                    break;

                // Implicitly NAV_INTERNAL. Issued, for example, if the
                // page itself requests a resource (CSS, JavaScript, ...).
                default:
                    this.log(`Allow request ${logURL}`);
                    break;
            }
            return REQ_ALLOW;
        } catch (error) {
            this.log("Error handling request", error);
            return REQ_ERROR;
        }
    }

    /**
     * Handle requests that try to prevent unloading a page.
     * @param {Electron.Event} event "will-prevent-unload".
     */
    onUnloadPage(event) {
        this.log(`${this.webContents.getURL()} is trying to prevent leaving the web site.`)
        const choice = dialog.showMessageBoxSync(this.browserWindow, {
            type: "question",
            buttons: ["Leave web site", "Stay"],
            title: "Do you want to leave this web site?",
            message: "Changes you made may not be saved.",
            defaultId: 0,
            cancelId: 1
        });
        if (choice === 0) {
            this.log(`Leaving ${this.webContents.getURL()}`);
            event.preventDefault();
        } else {
            this.log(`Staying on ${this.webContents.getURL()}`)
        }
    }

    /**
     * Write a message to the console.
     * @param {string} msg The message.
     * @param {Error} error An error object. If present, write to console.error.
     */
    log(msg, error) {
        if (error) {
            console.error(`${this.className} (${this.winId}): ${msg}\n`, error);
        } else if (this.config.Log) {
            console.log(`${this.className} (${this.winId}): ${msg}`);
        }
    }

    /**
     * Mandatory.
     * Will be called before the handler is destroyed.
     * Free resources to avoid memory leaks and other problems. Especially webContents and
     * browserWindow are tied to a BrowserWindow object which can be closed by users. On
     * closing a BrowserWindow this method will be called on every associated request handler.
     * Can also be used to clean up other things a handler may have allocated.
     */
    dispose() {
        this.config = undefined;
        this.settings = undefined;
        this.webContents = undefined;
        this.browserWindow = undefined;
    }
}

module.exports = DefaultRequestHandler;
