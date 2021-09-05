const {
    NAV_LOAD, NAV_RELOAD, NAV_BACK, NAV_FORWARD, NAV_INTERNAL,
    REQ_ERROR, REQ_NONE, REQ_CONTINUE, REQ_ALLOW, REQ_DENY
} = require("../RequestHandlerConsts.js");

/**
 * Nervous?
 */
class Nervous {

    constructor(config, settings, active, webContents, browserWindow) {
        this.className = this.constructor.name;
        this.settings = settings;
        this.browserWindow = browserWindow;
        this.winId = this.browserWindow.id;
        this.baseURL = "";
        console.log(`${this.className} (${this.winId}): Nervously waiting for input...`);
    }

    handleRequest(url, originalURL, navType) {
        if (navType === NAV_LOAD) {
            try {
                if (url.startsWith(`${this.settings.Scheme}://`)) {
                    this.log(`This is indeed a fine URL:  ${url}`);
                    return;
                }
                try {
                    const host = new URL(url).host.split(".");
                    if ((host.length === 1) && (host[0] === "")) {
                        this.log(`Hmm, this could be a local file, I'll be lenient...  ${url}`);
                        return;
                    }
                    this.baseURL = `${host.pop()}.${host.pop()}`;
                    this.log(`A new site, let's hope!  ${url}`);
                    return;
                } catch (error) {
                    this.log(`Ups, this makes me *very* nervous!  ${url}\n${error}`);
                }
            } finally {
                return REQ_CONTINUE;
            }
        }
        if ((url.startsWith(`${this.settings.Scheme}://`)) || ["<BACK>", "<FORWARD>", "<RELOAD>", "<INTERNAL>"].includes(url)) {
            this.log(`No problem here.  ${url}`);
            return REQ_CONTINUE;
        }
        const newHost = new URL(url).host.split(".");
        if (`${newHost.pop()}.${newHost.pop()}` !== this.baseURL) {
            this.log(`This makes me nervous!:  ${url.substring(0, 100)}...`);
            let X = this.browserWindow.getPosition()[0];
            let Y = this.browserWindow.getPosition()[1];
            let x = Math.trunc(Math.random() * 10);
            let y = Math.trunc(Math.random() * 10);
            if (Math.random() < 0.5) {
                this.browserWindow.setPosition(X + x, Y + y);
            } else {
                this.browserWindow.setPosition(X - x, Y - y);
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
        this.settings = null;
        this.browserWindow = null;
    }
}

module.exports = Nervous;
