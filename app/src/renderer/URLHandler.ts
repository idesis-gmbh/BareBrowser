import { BrowserWindow, WebviewTag } from "electron";
import { Settings } from "../shared/Settings";
import { HandleURLCallback } from "./RendererApplication";

/**
 *  Possible return values of function `handleURL` of any URL handler class.
 */
/**
 * An error occured handling this URL.
 * SingleInstanceBrowser will stop passing on the URL to the following handler.
 */
export const HANDLE_URL_ERROR: number = 0;
/**
 * This handler doesn't handle this URL.
 * SingleInstanceBrowser will pass the URL to the following handler.
 */
export const HANDLE_URL_NONE: number = 1;
/**
 * This handler has done something with the URL but
 * the URL should be passed on to the following handler.
 */
export const HANDLE_URL_CONTINUE: number = 2;
/**
 * This handler has done something with the URL
 * and any further processing should be prevented.
 */
export const HANDLE_URL_STOP: number = 3;

/**
 * Interface of a URL handler
 */
export declare class URLHandler {
    // Class name of the URL handler
    public ClassName: string;
    /**
     * URL handler constructor.
     * @param {Object} config A configuration for this URL handler. Passed in
     *        from its own section in `settings.json`.
     * @param {Settings} settings The settings of SingleInstanceBrowser (`settings.json`).
     * @param {WebviewTag} webView The WebView tag in the browser page
     * @param {BrowserWindow} browserWindow The Electron browser window which
     *        hosts the WebView tag.
     * @param {HandleURLCallback} handleURLCallback The callback function which must be called by
     *        any URL handler after handling the given URL.
     * @see Exported type HandleURLCallback in RendererApplication.ts.
     */
    constructor(config: Object, settings: Settings, webView: WebviewTag, browserWindow: BrowserWindow, handleURLCallback: HandleURLCallback);
    /**
     * Handles a given URL.
     * @param {string} url The URL to be handled by the URL handler.
     * @param {HandleURLCallback} handleURLCallback The callback function which must be called by any URL handler after handling the given URL.
     * @see Exported type HandleURLCallback in RendererApplication.ts.
     */
    public handleURL(url: string, handleURLCallback: HandleURLCallback): void;
}

/**
 * Create and return an instance of a URL handler.
 * @param {string} className The name of the URL handler class.
 * @param {Object} config An object which contains configuration data for the
 *        instance to return.
 * @param {Settings} settings The settings of SingleInstanceBrowser (`settings.json`).
 * @param {WebviewTag} webView The Electron web view tag of the browser window
 *        into which this instance will be loaded.
 * @param {BrowserWindow} browserWindow The Electron browser window into which
 *        the returned instance will be loaded.
 * @param {HandleURLCallback} handleURLCallback The callback function which must be called by
 *        any URL handler after handling the given URL.
 * @see Exported type HandleURLCallback in RendererApplication.ts.
 * @returns {URLHandler} An instance of a URL handler denoted by `className`.
 */
export function getURLHandlerByClassName(className: string, config: Object | undefined, settings: Settings, webView: WebviewTag, browserWindow: BrowserWindow, handleURLCallback: HandleURLCallback): URLHandler {
    const prototype = Object.create(global[className].prototype);
    return new prototype.constructor(config, settings, webView, browserWindow, handleURLCallback);
}
