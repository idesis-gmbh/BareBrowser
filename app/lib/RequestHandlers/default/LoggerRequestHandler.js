/**
 * @see DefaultRequestHandler.js
 */
const {
    NAV_LOAD, NAV_RELOAD, NAV_BACK, NAV_FORWARD, NAV_INTERNAL,
    REQ_ERROR, REQ_NONE, REQ_CONTINUE, REQ_ALLOW, REQ_DENY
} = require("../RequestHandlerConsts.js");

/**
 * This simple request handler just logs any request and allows access. It can be used to analyze
 * what pages/web sites want to load.
 */
class LoggerRequestHandler {

    /**
     * @see DefaultRequestHandler.js
     */
    constructor(config, settings, active, webContents, browserWindow) {
        this.className = this.constructor.name;
        this.winId = browserWindow.id;
        console.log(`${this.className} (${this.winId}): Instance created (Active=${active})`);
    }

    /**
     * @see DefaultRequestHandler.js
     */
    handleRequest(urlObj, originalURL, navType) {
        const logURL = urlObj.URL === originalURL ? urlObj.URL : `${urlObj.URL} (${originalURL})`;
        switch (navType) {
            case NAV_LOAD:
                this.log(`LOAD    => ${logURL}`);
                break;
            case NAV_RELOAD:
                this.log(`RELOAD  => ${logURL}`);
                break;
            case NAV_BACK:
                this.log(`BACK    => ${logURL}`);
                break;
            case NAV_FORWARD:
                this.log(`FORWARD => ${logURL}`);
                break;
            default:
                this.log(`REQUEST => ${logURL}`);
                break;
        }
        return REQ_NONE;
    }

    /**
     * Log to the console.
     * @param {string} msg The message.
     */
    log(msg) {
        console.log(`${this.className} (${this.winId}): ${msg}`);
    }

    /**
     * @see DefaultRequestHandler.js
     */
    dispose() { }
}

module.exports = LoggerRequestHandler;
