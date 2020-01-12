import { BrowserWindow, WebviewTag } from "electron";
import { ISettings } from "../shared/Settings";
import { HandleURLCallback } from "./RendererApplication";

/**
 *  Possible return values of function `handleURL` of any URL handler class.
 */
export enum HandleURL {
    /**
     * An error occured handling this URL.
     * SingleInstanceBrowser will stop passing on the URL to the following handler.
     */
    ERROR = 0,
    /**
     * This handler doesn't handle this URL.
     * SingleInstanceBrowser will pass the URL to the following handler.
     */
    NONE,
    /**
     * This handler has done something with the URL but
     * the URL should be passed on to the following handler.
     */
    CONTINUE,
    /**
     * This handler has done something with the URL
     * and any further processing should be prevented.
     */
    STOP,
}

/**
 * Interface of a URL handler
 */
export declare class URLHandler {
    /**
     * URL handler constructor.
     * @param config A configuration for this URL handler. Passed in from its own section in `settings.json`.
     * @param settings The settings of SingleInstanceBrowser (`settings.json`).
     * @param webView The WebView tag in the browser page
     * @param browserWindow The Electron browser window which hosts the WebView tag.
     * @param handleURLCallback The callback function which must be called
     *        by any URL handler after handling the given URL.
     * @see Exported type HandleURLCallback in RendererApplication.ts.
     */
    constructor(config: {}, settings: ISettings, webView: WebviewTag,
                browserWindow: BrowserWindow, handleURLCallback: HandleURLCallback);
    /**
     * Handles a given URL.
     * @param url The URL to be handled by the URL handler.
     * @param urlSource 'Who' created/issued the URL.
     * @param handleURLCallback The callback function which must be called by any
     *        URL handler after handling the given URL.
     * @see Exported type HandleURLCallback in RendererApplication.ts.
     */
    public handleURL(url: string, urlSource: number, handleURLCallback: HandleURLCallback): void;
}

/**
 * Create and return an instance of a URL handler.
 * @param className The name of the URL handler class.
 * @param config An object which contains configuration data for the instance to return.
 * @param settings The settings of SingleInstanceBrowser (`settings.json`).
 * @param webView The Electron web view tag of the browser window into which this instance will be loaded.
 * @param browserWindow The Electron browser window into which the returned instance will be loaded.
 * @param handleURLCallback The callback function which must be called by
 *        any URL handler after handling the given URL.
 * @see Exported type HandleURLCallback in RendererApplication.ts.
 * @returns An instance of a URL handler denoted by `className`.
 */
export function getURLHandlerByClassName(className: string, config: {} | undefined, settings: ISettings,
                                         webView: WebviewTag, browserWindow: BrowserWindow,
                                         handleURLCallback: HandleURLCallback): URLHandler {
    const prototype = Object.create(global[className].prototype);
    return new prototype.constructor(config, settings, webView, browserWindow, handleURLCallback);
}
