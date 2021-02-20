/**
 * @see DefaultRequestHandler.js
 */
const {
    NAV_LOAD, NAV_RELOAD, NAV_BACK, NAV_FORWARD, NAV_INTERNAL,
    REQ_ERROR, REQ_NONE, REQ_CONTINUE, REQ_ALLOW, REQ_DENY
} = require("./RequestHandlerConsts.js");

/**
 * A template for writing your own request handler.
 * @see DefaultRequestHandler.js
 */
class RequestHandlerTemplate {

    /**
     * @see DefaultRequestHandler.js
     */
    constructor(config, settings, active, webContents, browserWindow) {
        this.className = this.constructor.name;
        this.config = config;
        this.settings = settings;
        this.webContents = webContents;
        this.browserWindow = browserWindow;
        this.winId = this.browserWindow.id;
        console.log(`${this.className} (${this.winId}): Instance created with config (Active=${active}): ${JSON.stringify(this.config, 2)}`);
    }

    /**
     * @see DefaultRequestHandler.js
     */
    handleRequest(url, navType) {
        this.log(`(${navType}) ${url}`);
        switch (navType) {
            case NAV_LOAD:
            case NAV_RELOAD:
            case NAV_BACK:
            case NAV_FORWARD:
            case NAV_INTERNAL:
                break;
            default:
                this.log("Unknown navigation type:", navType);
                break;
        }
        // return REQ_ERROR;
        return REQ_NONE;
        // return REQ_CONTINUE;
        // return REQ_ALLOW;
        // return REQ_DENY;
    }

    /**
     * @see DefaultRequestHandler.js
     */
    log(msg, error) {
        if (error) {
            console.error(`${this.className} (${this.winId}): ${msg}\n`, error);
        } else if (this.config.Log) {
            console.log(`${this.className} (${this.winId}): ${msg}`);
        }
    }

    /**
     * @see DefaultRequestHandler.js
     */
    dispose() {
        this.config = null;
        this.settings = null;
        this.webContents = null;
        this.browserWindow = null;
    }
}

/**
 * @see DefaultRequestHandler.js
 */
module.exports = RequestHandlerTemplate;
