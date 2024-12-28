import { BrowserWindow } from "electron";
import { ISettings } from "../shared/Settings";
import { AnyObject } from "../shared/Types";

/**
 * Request handlers/request handling.
 */

/**
 * Types of navigation.
 */
export enum NavigationType {
    /**
     * Request for loading a page/resource. Issued by the address bar, the home page or the command
     * line.
     */
    LOAD = 0,
    /**
     * Request for reloading a page/resource. Issued by a keyboard shortcut.
     */
    RELOAD,
    /**
     * Go back in the browser history. Issued by the back button or a keyboard shortcut.
     */
    BACK,
    /**
     * Go forward in the browser history. Issued by the forward button or a keyboard shortcut.
     */
    FORWARD,
    /**
     * Not strictly a naviagtion. In almost all cases issued by the page itself, if it tres to load
     * resources.
     */
    INTERNAL,
}

/**
 * Passed to `handleRequest()` of every request handler. The property is the URL of the requested
 * resource. A request handler can modify `URL`, for example to redirect to another resource or to
 * modify query parameters before the request is passed to the next handler in the chain.
 */
export type URLObject = { URL: string; }; // eslint-disable-line jsdoc/require-jsdoc

/**
 *  Possible return values of function `handleRequest` of a request handler class.
 */
export enum RequestResult {
    /**
     * An error occured handling the request. BareBrowser won't call the following handler.
     */
    ERROR = 0,
    /**
     * The handler doesn't handle the request. BareBrowser will call the following handler.
     */
    NONE,
    /**
     * The handler has done something with the given resource (implicitly allowing the request).
     * BareBrowser will call the following handler.
     */
    CONTINUE,
    /**
     * The handler allows the request. BareBrowser won't call the following handler.
     */
    ALLOW,
    /**
     * The handler denies the request. BareBrowser won't call the following handler.
     */
    DENY,
}

/**
 * Interface of a request handler
 */
export declare class RequestHandler {
    /**
     * Mandatory. Request handler constructor.
     * @param config A configuration for this request handler. Passed in from its own section in
     * `settings.json`. Can be undefined.
     * @param settings The settings of BareBrowser (`settings.json`). Can be used to override global
     * settings for requests, for example the user agent.
     * @param active The handler is configured as active or not in `settings.json`. If active is
     * `false`, the handler won't be called by BareBrowser upon requests.
     * @param webContents The WebContents associated with the WebView tag in the browser page.
     * @param browserWindow The Electron browser window which hosts the WebView tag.
     */
    constructor(config: AnyObject | undefined, settings: ISettings, active: boolean, webContents: Electron.WebContents, browserWindow: BrowserWindow);

    /**
     * Set by BareBrowser on the instance after calling the constructor. The status is also given in
     * the contructor.
     */
    public IsActive: boolean;

    /**
     * Mandatory. Handle the request for a given URL.
     * @param urlObj {object} An object with a single property `URL` of type string. The property is
     * the URL of the requested resource.
     * @param originalURL The original URL (e. g. from the command line).
     * @param navigationType The type of the request/navigation issued.
     * See enum `NavigationType` above for possible values.
     * @returns A RequestResult which tells BareBrowser how to proceed with the request. See enum
     * `RequestResult` above for possible values.\
     * The request/navigation can be issued by
     * - clicking on a link in page which is already loaded,
     * - the page itslef, e.g. JavaScript,
     * - through the command line,
     * - through the address bar or
     * - through the back/forward button/keyboard shortcuts.
     * If a handler decides to be responsible for the given URL, it must handle the url
     * appropriately through calling methods on `this.webContents`, see also:
     * https://www.electronjs.org/docs/api/web-contents
     */
    public handleRequest(urlObj: URLObject, originalURL: string, navigationType: NavigationType): RequestResult;

    /**
     * Mandatory. Will be called before the handler is destroyed. Free resources to avoid memory
     * leaks and other problems. Especially `webContents` and `browserWindow` are tied to a
     * BrowserWindow object which can be closed by users. On closing a browser window this method
     * will be called on every associated request handler. Can also be used to clean up other things
     * a handler may have allocated.
     */
    public dispose(): void;
}
