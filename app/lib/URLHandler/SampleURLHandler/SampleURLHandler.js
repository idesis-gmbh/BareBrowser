/**
 * Mandatory import.
 * See file URLHandler.js for an explanation of the imported constants.
 */
require("../URLHandler.js");

/**
 * You must always choose a class name which won't interfere with 
 * other builtin global objects. See below (registering the class).
 */
const className = "SampleURLHandler"

/**
 * This is a sample URL Handler which will only let pass through URLs that match the regular expression
 * configured in `settings.json`. Any other URLs will be blocked and an info page will be displayed.
 */
class SampleURLHandler {

    /**
     * URL handler constructor.
     * @param {Object} config A configuration for this URL handler. Passed in from its own 
     *        section in `settings.json`, can be null or undefined.
     * @param {Object} settings The settings of SingleInstanceBrowser (`settings.json`). 
     *        Can be used to override global settings for requests, for example the user agent.
     * @param {Electron.WebviewTag} webView The WebView tag in the browser page.
     * @param {Electron.BrowserWindow} browserWindow The Electron browser window which 
     *        hosts the WebView tag.
     * @param {Function} handleURLCallback The callback function which must be called by 
     *        any URL handler after handling the given URL.
     * @see Exported type HandleURLCallback in RendererApplication.ts.
     */
    constructor(config, settings, webView, browserWindow, handleURLCallback) {
        this.ClassName = className;
        this.Config = config;
        this.Settings = settings;
        this.WebView = webView;
        this.BrowserWindow = browserWindow;
        this.HandleURLCallback = handleURLCallback;
        this.Active = false;
        this.showAlertOnce = true;
        // It's possible to attach event listeners to the WebView tag.
        this.WebView.addEventListener("dom-ready", this.onDOMReady.bind(this), false);
        console.log(className + ": instance created with config: " + JSON.stringify(this.Config, 2));
    }

    /**
     * Handle/load a URL. This method can do almost anything with the browser window 
     * and the web view tag. In this example it blocks loading any URL which doesn't
     * match the regular expression which is configured in the config object
     * (`see settings.json`).
     * @param {string} url The URL which should be opened. 
     */
    handleURL(url) {
        // Store the given URL for further usage in `onDOMReady`.
        this.URL = url;
        this.Active = true;
        console.log(className + ": attempt to open URL: " + this.URL);
        try {
            // Set default user agent from settings.
            this.WebView.setAttribute("useragent", this.Settings.UserAgent);
            const regExp = new RegExp(this.Config.URLRegExp);
            // Load URL only, if it matches the given regular expression
            if (regExp.test(this.URL)) {
                console.log(className + ": will open URL: " + this.URL);
                this.WebView.setAttribute("src", this.URL);
            } else {
                // Block URL and display an info page instead.
                console.log(className + ": blocking URL: " + this.URL);
                // Navigation should always be done by setting the `src` 
                // attribute, otherwise internal history handling won't work.
                this.WebView.setAttribute("src", encodeURI(
                    "data:text/html,<html><head></head><body>"
                    + "<h1>" + className + "</h1>"
                    + "<p>Sorry, this URL handler blocked the address <em>" + this.URL + "</em> you were trying to open.</p>"
                    + "<p>For more information about URL handlers please go to "
                    + "<a href='https://github.com/idesis-gmbh/SingleInstanceBrowser/blob/master/app/_root/README.md'> this page</a>.</p>"
                    + "</body></html>"
                ));
            }
        } catch (error) {
            this.Active = false;
            console.error(className + ": error handling URL: " + this.URL + "\n", error);
            this.HandleURLCallback(HANDLE_URL_ERROR);
        }
    }

    /**
     * Show a message by executing JavaScript in the webview when the DOM is ready (only once).
     * @param {Electron.Event} event The event fired when the DOM is ready.
     */
    onDOMReady(event) {
        // Only do something if we are active.
        if (!this.Active) {
            return
        }
        this.Active = false;
        if (this.showAlertOnce) {
            try {
                this.showAlertOnce = false;
                this.WebView.executeJavaScript(
                    "window.alert('This example message was issued by "
                    + "'this.WebView.executeJavaScript' which is called "
                    + "on the DOM Ready event of this.WebView! "
                    + "And it is shown only once.');"
                );
                // Signal stop for any further handlers
                this.HandleURLCallback(HANDLE_URL_STOP);
            } catch (error) {
                console.error(className + ": onDOMReady: error handling URL: " + this.URL + "\n", error);
                this.HandleURLCallback(HANDLE_URL_ERROR);
            }
        }
    }

}

// Register this class to enable dynamic instance creation.
global[className] = SampleURLHandler;
