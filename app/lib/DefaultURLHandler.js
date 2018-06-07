/**
 * Mandatory import.
 * See file URLHandler.js for an explanation of the imported constants.
 */
require("./URLHandler/URLHandler.js");

/**
 * You must always choose a class name which won't interfere with 
 * other builtin global objects. See below (registering the class).
 */
const className = "DefaultURLHandler"

/**
 * This is the default URL handler which will open *any* URL. If this handler isn't 
 * active (see `settings.json`), SingleInstanceBrowser won't load anything.
 */
class DefaultURLHandler {

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
        // Attach an event listener for signalling back the result when the page is loaded.
        this.WebView.addEventListener("dom-ready", this.onDOMReady.bind(this), false);
        console.log(className + ": instance created.");
    }

    /**
     * Handle/load a URL. This method can do almost anything with the browser
     * window and the web view tag. This default handler just opens *any* URL.
     * Note: this.HandleURLCallback is executed asynchronously and calling it 
     * should always be the last thing done in a URL handler!
     * (`see settings.json`).
     * It is also a good idea to wait for the DOM to finish loading (see 
     * `onDOMReady`) before calling `handleURLCallback` since otherwise the 
     * URL handler loop in (see `RendererApplication.ts`) may call other 
     * handlers to quickly.
     * @param {string} url The URL which should be opened. 
     */
    handleURL(url) {
        // Store the given URL for further usage in `onDOMReady`.
        this.URL = url;
        this.Active = true;
        console.log(className + ": attempt to open URL: " + this.URL);
        try {
            // Set default user agent from settings. This should be done always
            // since preceding handlers may have changed the user agent.
            this.WebView.setAttribute("useragent", this.Settings.UserAgent);
            // Navigation should always be done by setting the `src`
            // attribute, otherwise internal history handling won't work.
            this.WebView.setAttribute("src", this.URL);
        } catch (error) {
            this.Active = false;
            console.error(className + ": error handling URL: " + this.URL + "\n", error);
            // Signal error.
            this.HandleURLCallback(HANDLE_URL_ERROR);
        }
    }

    /**
     * Wait for the page to be loaded and then issue the callback.
     * @param {Electron.Event} event The event fired when the DOM is ready.
     */
    onDOMReady(event) {
        // The event should do nothing if this handler isn't handling a URL (this.Active).
        if (!this.Active) {
            return
        }
        this.Active = false;
        try {
            console.log(className + ": opened URL: " + this.URL);
            let newURL = this.WebView.getAttribute("src");
            if (newURL !== this.URL) {
                console.info(className + ": " + this.URL + " was redirected to " + newURL);
            }
            // Signal successful handling and let the following handler do its work.
            // An *intentional* redirect URL can be given to this.HandleURLCallback as
            // an optional second parameter, but it will only be used if the callback
            // is called with HANDLE_URL_NONE or HANDLE_URL_CONTINUE.
            this.HandleURLCallback(HANDLE_URL_CONTINUE, newURL !== this.URL ? newURL : null);
        } catch (error) {
            console.error(className + ": onDOMReady: error handling URL: " + this.URL + "\n", error);
            this.HandleURLCallback(HANDLE_URL_ERROR);
        }
    }

}

// Register this class to enable dynamic instance creation.
global[className] = DefaultURLHandler;
