import { BrowserWindow, Point, ipcRenderer, remote, webContents } from "electron";
import * as $ShortCuts from "mousetrap";
import { AppInfo, Settings } from "../shared/Settings";
import { URLItem, getURLItem } from "../shared/URLItem";
import { BrowserHistory, BrowserHistoryItem } from "./BrowserHistory";
import { HANDLE_URL_CONTINUE, HANDLE_URL_ERROR, HANDLE_URL_NONE, HANDLE_URL_STOP, URLHandler, getURLHandlerByClassName } from "./URLHandler";

/**
 * @see Funtion handleURLCallback in class `CRendererApplication`.
 */
export type HandleURLCallback = (handleURLResult: number, redirectURL?: string) => void;

/**
 * The class for the renderer application part. Creates a browser window and handles anything else.
 */
export class CRendererApplication {

    private settings: Settings;
    private appInfo: AppInfo;
    private addressBar: HTMLDivElement;
    private goBackButton: HTMLButtonElement;
    private goForwardButton: HTMLButtonElement;
    private urlField: HTMLInputElement;
    private spinner: HTMLDivElement;
    private window: BrowserWindow;
    private webContents: webContents;
    private webView: Electron.WebviewTag;
    private webViewScrollOffset: Point = {x: 0, y: 0};
    private reloadIssued: boolean = false;
    private URLHandlers: URLHandler[] = [];
    private currentURLHandler: URLHandler;
    private history: BrowserHistory;
    private currentHistoryItem: BrowserHistoryItem;
    private currentURL: string;
    private blankPage: string = "_blank";
    private blankPageContent: string = encodeURI("data:text/html,<html><head></head><body></body></html>");
    private errorPage: string = "";

    /**
     * Creates the user interface, the web content part and handles all events.
     */
    constructor() {
        this.settings = ipcRenderer.sendSync("IPC", ["getSettings"]) as Settings;
        this.appInfo = ipcRenderer.sendSync("IPC", ["getAppInfo"]) as AppInfo;
        const fragment: DocumentFragment = new DocumentFragment();
        this.webView = this.getWebView();
        this.addressBar = this.getAddressBar();
        this.addressBar.appendChild(this.getNavigationButtons());
        this.addressBar.appendChild(this.getURLField());
        this.spinner = this.getSpinner();
        this.addressBar.appendChild(this.spinner);
        fragment.appendChild(this.addressBar);
        fragment.appendChild(this.webView);
        document.body.appendChild(fragment);
        this.window = remote.getCurrentWindow();
        this.webContents = this.window.webContents;
        ipcRenderer.on("IPC", this.onIPC.bind(this));
        this.bindShortCuts();
        this.loadURLHandlers();
        this.history = new BrowserHistory(this.blankPage);
        this.queryInitialURLItem();
    }

    /**
     * Load URL handlers configured in settings.
     */
    private loadURLHandlers(): void {
        for (const urlHandlerEntry of this.settings.URLHandlers) {
            if ((urlHandlerEntry.Source) && (urlHandlerEntry.Source !== "")) {
                try {
                    require(urlHandlerEntry.Source);
                    const classInstance: URLHandler = getURLHandlerByClassName(
                        urlHandlerEntry.ClassName,
                        urlHandlerEntry.Config,
                        this.settings,
                        this.webView,
                        this.window,
                        this.handleURLCallback.bind(this),
                    );
                    this.URLHandlers.push(classInstance);
                } catch (error) {
                    console.error(`Error loading URL handler from: ${urlHandlerEntry.Source}\n${error}`);
                }
            }
        }
    }

    /**
     * Get the initial URL to be loaded via an IPC call from the main process.
     */
    private queryInitialURLItem(): void {
        const urlItem: URLItem = ipcRenderer.sendSync("IPC", ["queryURLItem"]) as URLItem;
        if ((urlItem && urlItem.DoLoad)) {
            this.loadURL(urlItem);
        } else {
            if (this.settings.Homepage !== "") {
                this.loadURL(getURLItem(this.settings.Homepage));
            } else {
                this.addressBar.style.display = "";
                this.urlField.focus();
            }
       }
    }

    /**
     * Bind keyboard shortcut(s) to a function.
     * @param {string} shortcut A single keyboard shortcut ar on array of shortcuts.
     * @param {Function} func The function to be executed if the given keyboard shortcut is used.
     */
    private bindShortCut(shortcut: string | string[], func: Function): void {
        $ShortCuts.bind(shortcut, (_event: ExtendedKeyboardEvent, _combo: string): boolean => {
            func.call(this);
            return false;
        });
    }

    /**
     * Bind all keyboard shortcuts from the app settings to the respective function.
     */
    private bindShortCuts(): void {
        this.bindShortCut(this.settings.ShortCuts.ToggleAddressBar, () => {
            this.addressBar.style.display === "none" ? this.addressBar.style.display = "" : this.addressBar.style.display = "none";
        });
        this.bindShortCut(this.settings.ShortCuts.ToggleInternalDevTools, () => {
            const devToolsOpened = this.webContents.isDevToolsOpened();
            devToolsOpened ? this.webContents.closeDevTools() : this.webContents.openDevTools();
        });
        this.bindShortCut(this.settings.ShortCuts.ToggleDevTools, () => {
            this.webView.isDevToolsOpened() ? this.webView.closeDevTools() : this.webView.openDevTools();
        });
        this.bindShortCut(this.settings.ShortCuts.FocusLocationBar, () => {
            if (this.addressBar.style.display === "none") {
                this.addressBar.style.display = "";
            }
            this.urlField.focus();
            this.urlField.select();
        });
        this.bindShortCut(this.settings.ShortCuts.InternalReload, () => {
            this.webContents.reload();
        });
        this.bindShortCut(this.settings.ShortCuts.Reload, () => {
            // Get the current scroll offset from the web view.
            this.webView.send("FromRenderer", "getScrollOffset");
            // Flag to ensure that DOMReady (see below) only does something
            // when the event was caused by a reload.
            this.reloadIssued = true;
            this.loadURL(getURLItem(this.currentURL), false);
        });
        this.bindShortCut(this.settings.ShortCuts.GoBack, () => {
            this.goBack();
        });
        this.bindShortCut(this.settings.ShortCuts.GoForward, () => {
            this.goForward();
        });
        this.bindShortCut(this.settings.ShortCuts.ExitHTMLFullscreen, () => {
            this.webView.executeJavaScript("document.webkitExitFullscreen();", true);
        });
        this.bindShortCut(this.settings.ShortCuts.ToggleWin32Menu, () => {
            ipcRenderer.send("IPC", ["toggleWin32Menu"]);
        });
    }

    /**
     * Let the first URL handler handle the given URL.
     * @param {URLItem} urlItem The URL to be handled.
     */
    private loadURL(urlItem: URLItem, updateHistory: boolean = true): void {
        if (this.URLHandlers.length === 0) {
            console.warn("loadURL: No URL handlers are configured!");
        } else {
            // Initial empty item in the browser history (always available).
            if (urlItem.OriginalURL === this.blankPage) {
                this.webView.setAttribute("src", this.blankPageContent);
                this.window.setTitle(this.appInfo.Name);
                return;
            }
            // Add new target or update existing target.
            if (updateHistory) {
                this.currentHistoryItem = this.history.addOrUpdateItem(urlItem.URL);
            }
            this.currentURLHandler = this.URLHandlers[0];
            this.currentURL = urlItem.URL;
            this.window.setTitle(urlItem.URL);
            this.spinner.style.visibility = "";
            this.currentURLHandler.handleURL(this.currentURL, this.handleURLCallback);
        }
    }

    /**
     * Callback function which *must* be called by any URL handler after handling a URL.
     * In future versions probably this can be done using Promises.
     * @param {URLHandler} currentURLHandler The URL handler which is calling this function.
     * @param {string} handleURLResult The result of handling the URL by the the URL handler.
     * @param {string} originalURL The original URL given to the URL handler.
     * @param {string} redirectURL Optional, if set, then this URL will be used for the following URL handler.
     * @see Function loadURLHandlers.
     */
    private handleURLCallback: HandleURLCallback = (handleURLResult: number, redirectURL?: string): void => {
        window.setTimeout(this.doHandleURLCallback.bind(this), 10, handleURLResult, redirectURL);
    }

    /**
     * @see Function handleURLCallback.
     */
    private doHandleURLCallback: HandleURLCallback = (handleURLResult: number, redirectURL?: string): void => {
        const nextHandler: URLHandler = this.URLHandlers[this.URLHandlers.indexOf(this.currentURLHandler)+1];
        const currentHandlerName: string = this.currentURLHandler.constructor.name;
        const logMsg: string = nextHandler ? "continuing with next handler" : "last handler in chain reached";
        try {
            switch (handleURLResult) {
                case HANDLE_URL_ERROR:
                    console.error(`handleURL: HANDLE_URL_ERROR: Calling URL handler ${currentHandlerName} with ${this.currentURL} returned with an error, stopping.`);
                    return;

                case HANDLE_URL_NONE:
                    console.log(`handleURL: HANDLE_URL_NON URL: handler ${currentHandlerName} didn't handle URL ${this.currentURL}, ${logMsg}.`);
                    break;

                case HANDLE_URL_CONTINUE:
                    console.log(`handleURL: HANDLE_URL_CONTINUE: Successfully called URL handler ${currentHandlerName} with ${this.currentURL}, ${logMsg}.`);
                    break;

                case HANDLE_URL_STOP:
                    console.log(`handleURL: HANDLE_URL_STOP: Successfully called URL handler ${currentHandlerName} with ${this.currentURL}, stopping.`);
                    return;

                default:
                    console.error(`handleURL: ${handleURLResult}: Calling URL handler ${currentHandlerName} with ${this.currentURL} returned an unknown result (${handleURLResult}), stopping.`);
                    return;
            }
            // Proceed with next handler (= implicitly HANDLE_URL_NONE or HANDLE_URL_CONTINUE)
            if (redirectURL) {
                console.log(`handleURL: ${currentHandlerName} redirected from ${this.currentURL} to ${redirectURL}.`);
            }
            if (nextHandler) {
                if (redirectURL) {
                    this.currentURL = redirectURL;
                }
                this.currentURLHandler = nextHandler;
                this.currentURLHandler.handleURL(this.currentURL, this.handleURLCallback);
            } else {
                this.webContents.session.setPermissionRequestHandler(this.onPermissionRequest.bind(this));
            }
        } catch (error) {
            console.error(`Error calling URL handler: ${currentHandlerName} with ${this.currentURL}\n${error}`);
        } finally {
            if ((handleURLResult !== HANDLE_URL_NONE) && (handleURLResult !== HANDLE_URL_CONTINUE)) {
                this.spinner.style.visibility = "hidden";
            }
        }
    }

    /**
     * Go back one step in the browser history.
     * @param {MouseEvent} _event A mouse event or null.
     */
    private goBack(_event?: MouseEvent): void {
        if (this.currentHistoryItem.Previous) {
            this.currentHistoryItem = this.currentHistoryItem.Previous;
            this.loadURL(getURLItem(this.currentHistoryItem.URL), false);
        }
    }

    /**
     * Go forward one step in the browser history.
     * @param {MouseEvent} _event A mouse event or null.
     */
    private goForward(_event?: MouseEvent): void {
        if (this.currentHistoryItem.Next) {
            this.currentHistoryItem = this.currentHistoryItem.Next;
            this.loadURL(getURLItem(this.currentHistoryItem.URL), false);
        }
    }

    /**
     * Called when the user clicks the Go button or presses Enter in the URL field.
     * @param {MouseEvent | KeyboardEvent} event A mouse or keyboard event.
     */
    private loadURLItemListener(event: MouseEvent | KeyboardEvent): void {
        if ((event.type === "keypress") && ((event as KeyboardEvent).key !== "Enter")) {
            return;
        }
        this.loadURL(getURLItem(this.urlField.value));
    }

    /**
     * Handles all IPC calls from the main process.
     * @param {Electron.Event} event An Electron event.
     * @param {any[]} args The arguments sent by the calling main process.
     */
    // tslint:disable-next-line:no-any
    private onIPC(_event: Electron.Event, ...args: any[]): void {
        if ((args.length === 0) || (!this.webView)) {
            return;
        }
        switch (args[0][0]) {
            case "loadURLItem":
                if (args[0].length === 2) {
                    this.loadURL((args[0][1] as URLItem));
                }
                break;

            default:
                break;
        }
    }

    /**
     * Called when the page has finished loading.
     * Sets the focus to the webview tag to enable keyboard navigation in the page.
     * @param {Electron.Event} _event An Electron event.
     */
    private onDidFinishLoad(_event: Electron.Event): void {
        this.spinner.style.visibility = "hidden";
        if (!this.webView.getWebContents().isFocused()) {
            this.webView.focus();
        }
    }

    /**
     * Called when loading the page failed.
     * @param {Electron.Event} _event An Electron event.
     */
    private onDidFailLoad(_event: Electron.DidFailLoadEvent): void {
        if (_event.isMainFrame) {
            this.errorPage = encodeURI(
                "data:text/html,<html><head></head><body>"
                + "<p>Error loading page: <em>" + _event.validatedURL + "</em></p>"
                + "<p>Code: <code>" + _event.errorCode + "</code></p>"
                + "<p>Description: <code>" + _event.errorDescription + "</code></p>"
                + "</body></html>",
            );
            this.webView.setAttribute("src", this.errorPage);
        } else {
            console.error("Error loading page: " + _event.validatedURL + "\nCode: " + _event.errorCode + "\nDescription: " + _event.errorDescription);
        }
    }

    /**
     * Called when the DOM in the web view is ready. Tries to scroll to the last
     * offset but only if the event occurs during a page *reload*.
     * @param {Electron.Event} _event An Electron event.
     */
    private onDOMReady(_event: Electron.Event): void {
        if (this.reloadIssued) {
            this.reloadIssued = false;
            this.webView.send("FromRenderer", "scrollToOffset", this.webViewScrollOffset);
        }
    }

    /**
     * Called when the title of the current page has been updated.
     * @param {Electron.PageTitleUpdatedEvent} event An Electron PageTitleUpdatedEvent.
     */
    private onPageTitleUpdated(event: Electron.PageTitleUpdatedEvent): void {
        this.window.setTitle(event.title);
    }

    /**
     * Called when a web page logs something to the browser console.
     * Default handling for the event is prevented, enhanced with additional
     * infos and again written to the console. In future versions this should
     * be redirected/copied to a log file.
     * @param {Electron.ConsoleMessageEvent} event An Electron ConsoleMessageEvent.
     */
    private onConsoleMessage(event: Electron.ConsoleMessageEvent): void {
        console.log("LOG from %s: [Level %d] %s (Line %d in %s)", this.webView.getURL(), event.level, event.message, event.line, event.sourceId);
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    /**
     * Handles permission requests from web pages.
     * Permissions are granted based on app settings.
     * @param {Electron.WebContents} _webContents The calling Electron webContents.
     * @param {string} permission The requested permission.
     * @param {function} callback A callback called with the boolean result of the permission check.
     */
    private onPermissionRequest(_webContents: Electron.WebContents, permission: string, callback: (permissionGranted: boolean) => void): void {
        const grant: boolean = (this.settings.Permissions.indexOf(permission) > -1);
        console.info(`Permission '${permission}' requested, ${grant ? "granting." : "denying."}`);
        callback(grant);
    }

    /**
     * Called when the navigaion to a URL has finished.
     * Used to update parts of the user interface.
     * @param {Electron.DidNavigateEvent} _event An Electron DidNavigateEvent.
     */
    private onDidNavigate(event: Electron.DidNavigateEvent): void {
        if (event.url === this.blankPageContent) {
            this.urlField.value = "";
        } else if (event.url === this.errorPage) {
            this.urlField.value = this.currentURL;
        } else {
            this.urlField.value = event.url;
        }
        this.goBackButton.disabled = (this.history.Size < 2 || this.currentHistoryItem === null || this.currentHistoryItem.Previous === undefined);
        this.goForwardButton.disabled = (this.history.Size < 2 || this.currentHistoryItem === null || this.currentHistoryItem.Next === undefined);
    }

    /**
     * Called when the navigaion to a URL has finished.
     * Used to update parts of the user interface.
     * @param {Electron.DidNavigateEvent} _event An Electron DidNavigateEvent.
     */
    private onDidNavigateInPage(event: Electron.DidNavigateInPageEvent): void {
        this.currentHistoryItem = this.history.addOrUpdateItem(getURLItem(event.url).URL);
        this.urlField.value = event.url;
        this.goBackButton.disabled = (this.history.Size < 2 || this.currentHistoryItem === null || this.currentHistoryItem.Previous === undefined);
        this.goForwardButton.disabled = (this.history.Size < 2 || this.currentHistoryItem === null || this.currentHistoryItem.Next === undefined);
    }

    /**
     * Called when the user clicks on a link in a page which should be opened in another window/tab.
     * @param {Electron.NewWindowEvent} event An Electron NewWindowEvent.
     */
    private onNewWindow(event: Electron.NewWindowEvent): void {
        if (this.settings.AllowNewWindows) {
            // Excluding `save-to-disk` for now
            if (["default",
                "foreground-tab",
                "background-tab",
                "new-window",
                //"save-to-disk",
                "other"].indexOf(event.disposition) !== -1) {
                ipcRenderer.send("IPC", ["openWindow", event.url]);
            }
        }
    }

    /**
     * This function stores the current scroll offset from the web view.
     * Called from the web view; this is the result from sending "getScrollOffset" to the web view.
     * @param {Electron IpcMessageEvent} event An Electron IpcMessageEvent.
     */
    private onWebViewIPCMessage(event: Electron.IpcMessageEvent): void {
        if (event.channel === "FromWebView") {
            if (event.args[0] === "setScrollOffset") {
                this.webViewScrollOffset.x = event.args[1];
                this.webViewScrollOffset.y = event.args[2];
            }
        }
    }

    /**
     * Build the address bar.
     * @returns {HTMLDivElement} The DOM element for the address bar.
     */
    private getAddressBar(): HTMLDivElement {
        const addressBar: HTMLDivElement = document.createElement("div");
        addressBar.setAttribute("id", "addressBar");
        // Initially hidden; made visible depending on command line params
        addressBar.style.display = "none";
        return addressBar;
    }

    /**
     * Build the navigation buttons.
     * @returns {HTMLDivElement} The DOM element(s) for the navigation buttons.
     */
    private getNavigationButtons(): HTMLDivElement {
        const navigationButtonsContainer: HTMLDivElement = document.createElement("div");
        navigationButtonsContainer.setAttribute("id", "navigationButtonsContainer");

        this.goBackButton = document.createElement("button");
        this.goBackButton.setAttribute("id", "goBack");
        this.goBackButton.disabled = true;
        this.goBackButton.title = "Go back";
        this.goBackButton.disabled = true;
        this.goBackButton.appendChild(document.createTextNode("<"));
        this.goBackButton.addEventListener("click", this.goBack.bind(this), false);
        navigationButtonsContainer.appendChild(this.goBackButton);

        this.goForwardButton = document.createElement("button");
        this.goForwardButton.setAttribute("id", "goForward");
        this.goForwardButton.disabled = true;
        this.goForwardButton.title = "Go forward";
        this.goForwardButton.appendChild(document.createTextNode(">"));
        this.goForwardButton.addEventListener("click", this.goForward.bind(this), false);
        navigationButtonsContainer.appendChild(this.goForwardButton);

        const goButton: HTMLButtonElement = document.createElement("button");
        goButton.setAttribute("id", "goButton");
        goButton.title = "Open URL";
        goButton.appendChild(document.createTextNode("Go"));
        goButton.addEventListener("click", this.loadURLItemListener.bind(this), false);
        navigationButtonsContainer.appendChild(goButton);

        return navigationButtonsContainer;
    }

    /**
     * Build the navigation buttons.
     * @returns {HTMLDivElement} The DOM element(s) for the navigation buttons.
     */
    private getSpinner(): HTMLDivElement {
        const spinnerContainer: HTMLDivElement = document.createElement("div");
        spinnerContainer.setAttribute("id", "spinner");
        const spinnerImg: HTMLImageElement = document.createElement("img");
        spinnerContainer.style.visibility = "hidden";
        spinnerImg.setAttribute("id", "spinner-img");
        spinnerImg.setAttribute("src", "./style/spinner.png");
        spinnerContainer.appendChild(spinnerImg);
        return spinnerContainer;
    }

    /**
     * Build the URL text field.
     * @returns {HTMLDivElement} The DOM element(s) for the URL text field.
     */
    private getURLField(): HTMLDivElement {
        const urlFieldContainer: HTMLDivElement = document.createElement("div");
        urlFieldContainer.setAttribute("id", "urlFieldContainer");
        this.urlField = document.createElement("input");
        this.urlField.setAttribute("id", "urlField");
        this.urlField.setAttribute("type", "text");
        if (this.settings.ShortCuts.Global) {
            this.urlField.setAttribute("class", "mousetrap");
        }
        this.urlField.addEventListener("keypress", this.loadURLItemListener.bind(this), false);
        urlFieldContainer.appendChild(this.urlField);
        return urlFieldContainer;
    }

    /**
     * Build the webview tag.
     * @returns {Electron.WebviewTag} A completely configured Electron.WebviewTag.
     */
    private getWebView(): Electron.WebviewTag {
        const webView: Electron.WebviewTag = document.createElement("webview");
        webView.setAttribute("id", "webView");
        webView.setAttribute("autosize", "");
        if (this.settings.AllowPlugins) {
            webView.setAttribute("plugins", "");
        }
        if (this.settings.AllowPopups) {
            webView.setAttribute("allowpopups", "");
        }
        webView.setAttribute("useragent", this.settings.UserAgent);
        webView.setAttribute("preload", "./lib/preload.js");
        webView.addEventListener("did-navigate", this.onDidNavigate.bind(this), false);
        webView.addEventListener("did-navigate-in-page", this.onDidNavigateInPage.bind(this), false);
        webView.addEventListener("did-finish-load", this.onDidFinishLoad.bind(this), false);
        webView.addEventListener("did-fail-load", this.onDidFailLoad.bind(this), false);
        webView.addEventListener("dom-ready", this.onDOMReady.bind(this), false);
        webView.addEventListener("page-title-updated", this.onPageTitleUpdated.bind(this), false);
        webView.addEventListener("console-message", this.onConsoleMessage.bind(this), false);
        webView.addEventListener("new-window", this.onNewWindow.bind(this), false);
        webView.addEventListener("ipc-message", this.onWebViewIPCMessage.bind(this), false);
        return webView;
    }

}
