import { Point, ipcRenderer, remote } from "electron";
import * as $ShortCuts from "mousetrap";
import { AppInfo, Settings } from "../shared/Settings";
import { URLItem, getURLItem } from "../shared/URLItem";

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
    private webView: Electron.WebviewTag;
    private webViewScrollOffset: Point = {x: 0, y: 0};
    private reloadIssued: boolean = false;

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
        fragment.appendChild(this.addressBar);
        fragment.appendChild(this.webView);
        document.body.appendChild(fragment);
        remote.getCurrentWindow().webContents.session.setPermissionRequestHandler(this.onPermissionRequest.bind(this));
        ipcRenderer.on("IPC", this.onIPC.bind(this));
        this.bindShortCuts();
        this.queryInitialURLItem();
    }

    /**
     * Get the initial URL to be loaded via an IPC call from the main process.
     */
    private queryInitialURLItem(): void {
        // tslint:disable-next-line:no-any
        const urlItem: URLItem = (ipcRenderer.sendSync("IPC", ["queryURLItem"]) as any) as URLItem;
        if ((urlItem && urlItem.DoLoad)) {
            this.loadURL(urlItem.URL);
        } else {
            if (this.settings.Homepage !== "") {
                this.loadURL(this.settings.Homepage);
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
            const devToolsOpened = remote.getCurrentWindow().webContents.isDevToolsOpened();
            devToolsOpened ? remote.getCurrentWindow().webContents.closeDevTools() : remote.getCurrentWindow().webContents.openDevTools();
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
            remote.getCurrentWindow().webContents.reload();
        });
        this.bindShortCut(this.settings.ShortCuts.Reload, () => {
            // Get the current scroll offset from the web view.
            this.webView.send("FromRenderer", "getScrollOffset");
            // Flag to ensure that DOMReady (see below) only does something
            // when the event was caused by a reload.
            this.reloadIssued = true;
            this.webView.reload();
        });
        this.bindShortCut(this.settings.ShortCuts.GoBack, () => {
            this.webView.goBack();
        });
        this.bindShortCut(this.settings.ShortCuts.GoForward, () => {
            this.webView.goForward();
        });
        this.bindShortCut(this.settings.ShortCuts.ExitHTMLFullscreen, () => {
            this.webView.executeJavaScript("document.webkitExitFullscreen();", true);
        });
        this.bindShortCut(this.settings.ShortCuts.ToggleWin32Menu, () => {
            ipcRenderer.send("IPC", ["toggleWin32Menu"]);
        });
    }

    /**
     * Load a URL in the webview tag.
     * @param url The URL string to be loaded.
     */
    private loadURL(url: string): void {
        this.webView.setAttribute("src", $URLItem.getURLItem(url).URL);
    }

    /**
     * Go back one step in the browser history.
     * @param {MouseEvent} _event A mouse event or null.
     */
    private goBack(_event: MouseEvent): void {
        this.webView.goBack();
    }

    /**
     * Go forward one step in the browser history.
     * @param {MouseEvent} _event A mouse event or null.
     */
    private goForward(_event: MouseEvent): void {
        this.webView.goForward();
    }

    /**
     * Called when the user clicks the Go button or presses Enter in the URL field.
     * @param {MouseEvent | KeyboardEvent} event A mouse or keyboard event.
     */
    private loadURLItemListener(event: MouseEvent | KeyboardEvent): void {
        if ((event.type === "keypress") && ((event as KeyboardEvent).key !== "Enter")) {
            return;
        }
        this.loadURL(this.urlField.value);
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
                    this.loadURL((args[0][1] as $URLItem.URLItem).URL);
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
        if (!this.webView.getWebContents().isFocused()) {
            this.webView.focus();
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
        remote.getCurrentWindow().setTitle(event.title);
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
    private onDidNavigate(_event: Electron.DidNavigateEvent): void {
        this.urlField.value = this.webView.getURL();
        this.goBackButton.disabled = !this.webView.canGoBack();
        this.goForwardButton.disabled = !this.webView.canGoForward();
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
        webView.addEventListener("did-finish-load", this.onDidFinishLoad.bind(this), false);
        webView.addEventListener("dom-ready", this.onDOMReady.bind(this), false);
        webView.addEventListener("page-title-updated", this.onPageTitleUpdated.bind(this), false);
        webView.addEventListener("console-message", this.onConsoleMessage.bind(this), false);
        webView.addEventListener("new-window", this.onNewWindow.bind(this), false);
        webView.addEventListener("ipc-message", this.onWebViewIPCMessage.bind(this), false);
        return webView;
    }

}
