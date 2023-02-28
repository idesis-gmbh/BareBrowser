/**
 * @see DefaultRequestHandler.js
 */
const {
    NAV_LOAD, NAV_RELOAD, NAV_BACK, NAV_FORWARD, NAV_INTERNAL,
    REQ_ERROR, REQ_NONE, REQ_CONTINUE, REQ_ALLOW, REQ_DENY
} = require("../RequestHandlerConsts.js");

/**
 * This handler is a primitive but effective filter for all requests made by users or web pages.
 * For example, if you log the requests of a web site with the help of the RequestLoggerHandler
 * it's easy to define a set of filter rules which allow/deny requests of this (or additional)
 * site(s), so it could be used as a simple ad blocker. A more realistic use case is to restrict
 * access to a limited set of URLs inside an organization.
 */
class FilterRequestHandler {

    /**
     * @see DefaultRequestHandler.js
     */
    constructor(config, settings, active, webContents, browserWindow) {
        this.className = this.constructor.name;
        this.config = config;
        this.settings = settings;
        this.winId = browserWindow.id;
        this.filters = [];
        for (const filter of this.config.Filter) {
            this.filters.push(new RegExp(filter));
        }
        console.log(`${this.className} (${this.winId}): Instance created with config (Active=${active}): ${JSON.stringify(this.config, 2)}`);
    }

    /**
     * @see DefaultRequestHandler.js
     */
    handleRequest(url, originalURL, navType) {
        const logURL = url === originalURL ? url : `${url} (${originalURL})`;
        for (const regExp of this.filters) {
            if (regExp.test(url)) {
                if (this.config.LogAllow) {
                    this.log(`ALLOW ${logURL}`);
                }
                return REQ_NONE;
            }
        }
        if (this.config.LogDeny) {
            this.log(`DENY  ${logURL}`);
        }
        return REQ_DENY;
    }

    /**
     * Write a message to the console.
     * @param {string} msg The message.
     * @param {Error} error An error object. If present, write to console.error.
     */
    log(msg, error) {
        if (error) {
            console.error(`${this.className} (${this.winId}): ${msg}\n`, error);
        } else {
            console.log(`${this.className} (${this.winId}): ${msg}`);
        }
    }

    /**
     * @see DefaultRequestHandler.js
     */
    dispose() {
        this.config = undefined;
        this.settings = undefined;
    }
}

module.exports = FilterRequestHandler;
