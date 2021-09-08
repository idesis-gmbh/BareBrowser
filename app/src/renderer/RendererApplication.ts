import { ipcRenderer, Point } from "electron";
import * as ShortCuts from "mousetrap";
import { APP_INFO } from "../shared/AppInfo";
import { getIPCMessage, IPC, IPC_MAIN_RENDERER, IPC_WEBVIEW_RENDERER } from "../shared/IPC";
import { ISettings } from "../shared/Settings";
import { AnyObject } from "../shared/Types";
import { IURLItem } from "../shared/URLItem";
import { format } from "../shared/Utils";

/**
 * The class for the renderer application part. Creates a browser window and handles anything else.
 */
export class RendererApplication {
    private windowID: number;
    private ready = false;
    private settings: ISettings;
    private addressBar: HTMLDivElement;
    private goBackButton: HTMLButtonElement;
    private goForwardButton: HTMLButtonElement;
    private urlField: HTMLInputElement;
    private spinner: HTMLDivElement;
    private addressHint: HTMLDivElement;
    private addressHintURL: HTMLSpanElement;
    private webView: Electron.WebviewTag;
    private errorInfo: HTMLDivElement;
    private webViewScrollOffset: Point = { x: 0, y: 0 }; // eslint-disable-line jsdoc/require-jsdoc
    private blankPageContent = encodeURI(`data:text/html,<html><head><title>${APP_INFO.ProductName}</title></head><body></body></html>`);

    /**
     * Creates the user interface, the web content part and handles all events.
     */
    constructor() {
        console.log("Creating new renderer...");
        ipcRenderer.on(IPC_MAIN_RENDERER, this.onIPCFromMain.bind(this));
        this.settings = ipcRenderer.sendSync(IPC_MAIN_RENDERER, this.windowID, IPC.GET_SETTINGS) as ISettings;
        this.buildUI();
        this.bindShortCuts();
        this.loadURL(this.blankPageContent, this.blankPageContent);
    }

    /**
     * Called by `onDidStartLoading`. The webview tag now has a webContents object so it's possible
     * to ask the main process for the initial URL to be loaded.
     */
    private setRendererReady(): void {
        if (this.ready) {
            return;
        }
        this.ready = true;
        ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.RENDERER_READY, this.webView.getWebContentsId());
        const urlItem: IURLItem = ipcRenderer.sendSync(IPC_MAIN_RENDERER, this.windowID, IPC.QUERY_INITIAL_URL_ITEM) as IURLItem;
        if ((urlItem && urlItem.DoLoad)) {
            this.loadURL(urlItem.URL, urlItem.OriginalURL);
        } else {
            if (this.settings.Homepage !== "") {
                this.loadURL(this.settings.Homepage, this.settings.Homepage);
            } else {
                if (this.settings.AddressBar === 2) {
                    // TODO: Handle this in onWebViewDidStopLoading?
                    setTimeout(() => this.urlField.focus(), 1000);
                }
            }
        }
        console.log("Creating new renderer done.");
    }

    /**
     * Build user interface.
     */
    private buildUI(): void {
        const fragment: DocumentFragment = new DocumentFragment();
        this.addressBar = this.getAddressBar();
        this.addressBar.appendChild(this.getNavigationButtons());
        this.addressBar.appendChild(this.getURLField());
        this.spinner = this.getSpinner();
        this.addressBar.appendChild(this.spinner);
        this.errorInfo = this.getErrorInfo();
        this.webView = this.getWebView();
        this.addressHint = this.getAddressHint();
        fragment.appendChild(this.addressBar);
        fragment.appendChild(this.errorInfo);
        fragment.appendChild(this.webView);
        fragment.appendChild(this.addressHint);
        document.body.appendChild(fragment);
    }

    /**
     * Display error message.
     * @param event An Electron DidFailLoadEvent.
     */
    private displayError(event: Electron.DidFailLoadEvent): void {
        if (event.isMainFrame && (event.validatedURL !== "")) {
            this.setWindowTitle(`${APP_INFO.ProductName} | Error`);
            this.urlField.value = event.validatedURL;
            this.errorInfo.innerHTML =
                `<p><strong>Error loading page:</strong> ${event.validatedURL}</p>`
                + `<p><strong>Code:</strong> <code>${event.errorCode}</code></p>`
                + `<p><strong>Description:</strong> <code>${event.errorDescription}</code></p>`;
            this.errorInfo.style.display = "";
        } else {
            console.error(`Error loading page/resource: ${event.validatedURL} \nCode: ${event.errorCode} \nDescription: ${event.errorDescription}`);
        }
    }

    /**
     * Hide error message;
     * @param updateWindowTitle `true` if the window title should be updated 
     * (currently only when the error message is clicked on).
     */
    private clearError(updateWindowTitle: boolean): void {
        if (updateWindowTitle) {
            this.setWindowTitle(APP_INFO.ProductName);
        }
        this.errorInfo.style.display = "none";
        this.errorInfo.innerHTML = "";
    }

    /**
     * Bind keyboard shortcut(s) to a function.
     * @param shortcut A single keyboard shortcut or on array of shortcuts.
     * @param func The function to be executed if the given keyboard shortcut is used.
     */
    private bindShortCut(shortcut: string | string[], func: () => void): void {
        ShortCuts.bind(shortcut, (_event: ShortCuts.ExtendedKeyboardEvent, _combo: string): boolean => {
            func.call(this);
            return false;
        });
    }

    /**
     * Bind all keyboard shortcuts from the app settings to the respective function.
     */
    private bindShortCuts(): void {
        this.bindShortCut(this.settings.ShortCuts.ToggleAddressBar, () => {
            if (this.settings.AddressBar > 0) {
                this.addressBar.style.display === "none" ?
                    this.addressBar.style.display = "" : this.addressBar.style.display = "none";
            }
        });
        this.bindShortCut(this.settings.ShortCuts.ToggleInternalDevTools, () => {
            ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.TOGGLE_INTERNAL_DEV_TOOLS);
        });
        this.bindShortCut(this.settings.ShortCuts.ToggleDevTools, () => {
            ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.RELOAD_URL);
            this.webView.isDevToolsOpened() ? this.webView.closeDevTools() : this.webView.openDevTools();
        });
        this.bindShortCut(this.settings.ShortCuts.FocusLocationBar, () => {
            if (this.settings.AddressBar > 0) {
                if (this.addressBar.style.display === "none") {
                    this.addressBar.style.display = "";
                }
                this.urlField.focus();
                this.urlField.select();
            }
        });
        this.bindShortCut(this.settings.ShortCuts.InternalReload, () => {
            // Deactivated for now; would also probably break this renderer.
            // this.webContents.reload();
        });
        this.bindShortCut(this.settings.ShortCuts.NewWindow, () => {
            if (this.settings.AllowNewWindows) {
                ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.NEW_WINDOW, "");
            }
        });
        this.bindShortCut(this.settings.ShortCuts.Reload, () => {
            ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.RELOAD_URL);
            // // Get the current scroll offset from the web view.
            // void this.webView.send(IPC_WEBVIEW_RENDERER, IPC.GET_SCROLL_OFFSET);
            // // Flag to ensure that DOMReady (see below) only does something
            // // when the event was caused by a reload.
            // this.reloadIssued = true;
            // this.webView.reload(); // this.webView.src = this.webView.src;
        });
        this.bindShortCut(this.settings.ShortCuts.GoBack, () => {
            this.goBack();
        });
        this.bindShortCut(this.settings.ShortCuts.GoForward, () => {
            this.goForward();
        });
        this.bindShortCut(this.settings.ShortCuts.GoHome, () => {
            if (this.settings.Homepage.trim() !== "") {
                this.loadURL(this.settings.Homepage, this.settings.Homepage);
            }
        });
        this.bindShortCut(this.settings.ShortCuts.GoInternalHome, () => {
            this.loadURL("home:", "home:");
        });
        this.bindShortCut(this.settings.ShortCuts.ExitHTMLFullscreen, () => {
            void this.webView.executeJavaScript("document.webkitExitFullscreen();", true);
        });
        this.bindShortCut(this.settings.ShortCuts.ToggleMenu, () => {
            ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.TOGGLE_MENU);
        });
    }

    /**
     * Tell the main process to open the given URL.
     * @param url The URL to be opened.
     * @param originalURL The original URL (e. g. from the command line or equal to `url`).
     */
    private loadURL(url: string, originalURL: string): void {
        // Blank URL
        if (url === this.blankPageContent) {
            this.webView.setAttribute("src", this.blankPageContent);
            return;
        }
        this.spinner.style.visibility = "";
        ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.LOAD_URL, url, originalURL);
    }

    /**
     * Go back one step in the browser history.
     * @param _event A mouse event or null.
     */
    private goBack(_event?: MouseEvent): void {
        ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.GO_BACK);
    }

    /**
     * Go forward one step in the browser history.
     * @param _event A mouse event or null.
     */
    private goForward(_event?: MouseEvent): void {
        ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.GO_FORWARD);
    }

    /**
     * Called when the user clicks the Go button or presses Enter in the URL field.
     * @param event A mouse or keyboard event.
     */
    private loadURLItemListener(event: MouseEvent | KeyboardEvent): void {
        if ((event.type === "keypress") && ((event as KeyboardEvent).key !== "Enter")) {
            return;
        }
        const url = this.urlField.value.trim();
        if (url === "") {
            this.loadURL(this.blankPageContent, this.blankPageContent);
        } else if (this.settings.AllowNewWindows && url.startsWith("new:")) {
            ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.NEW_WINDOW, url);
        } else {
            this.loadURL(url, url);
        }
    }

    /**
     * Set a new title for this window.
     * @param title The new window title
     */
    private setWindowTitle(title: string) {
        ipcRenderer.send(IPC_MAIN_RENDERER, this.windowID, IPC.SET_WINDOW_TITLE, title);
    }

    /**
     * Called when a web page logs something to the browser console.
     * The message is enhanced with additional infos and again written
     * to the console of the hosting browser window. In future versions
     * this should be redirected/copied to a log file.
     * @param event An Electron ConsoleMessageEvent.
     */
    private onWebViewConsoleMessage(event: Electron.ConsoleMessageEvent): void {
        const logMessage = format("LOG [Level %d] [Line %d in %s]\nFrom: %s\n\n%s", event.level, event.line, event.sourceId, this.webView.getURL(), event.message);
        // Silence Electron warning message during development.
        if (!APP_INFO.IsPackaged && (logMessage.indexOf("This warning will not show up") > -1)) {
            return;
        }
        switch (event.level) {
            case 0:
            case 1:
                console.log(logMessage);
                break;

            case 2:
                console.warn(logMessage);
                break;

            case 3:
                console.error(logMessage);
                break;

            default:
                console.log(logMessage);
                break;
        }
    }

    /**
     * Called when the page starts loading.
     * @param _event An Electron event.
     */
    private onWebViewDidStartLoading(_event: Electron.Event): void {
        // console.log("DID-START_LOADING", this.webView.src);
        this.clearError(false);
        this.spinner.style.visibility = "";
    }

    /**
     * Called when loading the page failed.
     * @param event An Electron event.
     */
    private onWebViewDidFailLoad(event: Electron.DidFailLoadEvent): void {
        console.log("DID-FAIL-LOAD");
        this.displayError(event);
    }

    /**
     * Called when the page has finished loading.
     * Sets the focus to the webview tag to enable keyboard navigation in the page.
     * @param _event An Electron event.
     */
    // private onWebViewDidFinishLoad(_event: Electron.Event): void {
    //     console.log("DID-FINISH-LOAD");
    //     this.spinner.style.visibility = "hidden";
    //     this.webView.focus();
    // }    

    /**
     * Called when the page has finished loading.
     * Sets the focus to the webview tag to enable keyboard navigation in the page.
     * @param _event An Electron event.
     */
    private onWebViewDidStopLoading(_event: Electron.Event): void {
        // console.log("DID-STOP-LOADING");
        this.spinner.style.visibility = "hidden";
        this.webView.focus();
    }

    /**
     * Called when the DOM in the web view is ready. Tries to scroll to the last
     * offset but only if the event occurs during a page *reload*.
     * @param _event An Electron event.
     */
    // private onWebViewDOMReady(_event: Electron.Event): void {
    //     // console.log("DOM-READY");
    //     // if (this.reloadIssued) {
    //     //     this.reloadIssued = false;
    //     //     void this.webView.send(IPC_WEBVIEW_RENDERER, IPC.SCROLL_TO_OFFSET, this.webViewScrollOffset);
    //     // }
    // }

    /**
     * Called when the navigaion to a URL has finished. Used to update parts of the user interface.
     * @param event An Electron DidNavigateEvent.
     */
    private onWebViewDidNavigate(event: Electron.DidNavigateEvent): void {
        // console.log("DID-NAVIGATE", event.url);
        if (event.url === this.blankPageContent) {
            this.urlField.value = "";
        } else {
            this.urlField.value = event.url;
        }
        this.goForwardButton.disabled = !this.webView.canGoForward();
        this.goBackButton.disabled = !this.webView.canGoBack();
    }

    /**
     * Called when the navigation to a target inside the page has finished.
     * Used to update parts of the user interface.
     * @param event An Electron DidNavigateInPageEvent.
     */
    private onWebViewDidNavigateInPage(event: Electron.DidNavigateInPageEvent): void {
        // console.log("DID-NAVIGATE-IN-PAGE", event.url);
        this.urlField.value = event.url;
        this.goForwardButton.disabled = !this.webView.canGoForward();
        this.goBackButton.disabled = !this.webView.canGoBack();
    }

    /**
     * Called when the title of the embedded page has been updated.
     * @param event An Electron PageTitleUpdatedEvent.
     */
    private onWebViewPageTitleUpdated(event: Electron.PageTitleUpdatedEvent): void {
        // console.log("PAGE-TITLE-UPDATED");
        this.setWindowTitle(event.title);
    }

    /**
     * Called when the user hovers over a link of the embedded page or focuses a link with the keyboard.
     * @param event An Electron UpdateTargetUrlEvent.
     */
    private onWebViewUpdateTargetURL(event: Electron.UpdateTargetUrlEvent): void {
        // console.log("UPDATE-TARGET-URL");
        this.addressHintURL.textContent = event.url;
        event.url === "" ? this.addressHint.classList.add("hidden") : this.addressHint.classList.remove("hidden");
    }

    /**
     * Build the address bar.
     * @returns The DOM element for the address bar.
     */
    private getAddressBar(): HTMLDivElement {
        const addressBar: HTMLDivElement = document.createElement("div");
        addressBar.setAttribute("id", "addressBar");
        if (this.settings.AddressBar < 2) {
            addressBar.style.display = "none";
        }
        return addressBar;
    }

    /**
     * Build the navigation buttons.
     * @returns The DOM element(s) for the navigation buttons.
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
     * @returns The DOM element(s) for the navigation buttons.
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
     * @returns The DOM element(s) for the URL text field.
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
     * Build the hint for the address which is shown when hovering over a link.
     * @returns The DOM element for the address hint.
     */
    private getAddressHint(): HTMLDivElement {
        this.addressHint = document.createElement("div");
        this.addressHint.setAttribute("id", "addressHint");
        this.addressHintURL = document.createElement("span");
        this.addressHintURL.setAttribute("id", "addressHintURL");
        this.addressHint.appendChild(this.addressHintURL);
        return this.addressHint;
    }

    /**
     * Build the container for error messages.
     * @returns A div element for error messages.
     */
    private getErrorInfo(): HTMLDivElement {
        const errorInfo: HTMLDivElement = document.createElement("div");
        errorInfo.id = "errorInfo";
        errorInfo.style.display = "none";
        errorInfo.title = "Hide error";
        errorInfo.addEventListener("click", () => this.clearError(true));
        return errorInfo;
    }

    /**
     * Build the webview tag.
     * @returns A completely configured Electron.WebviewTag.
     */
    private getWebView(): Electron.WebviewTag {
        const webView: Electron.WebviewTag = document.createElement("webview");
        webView.setAttribute("id", "webView");
        if (this.settings.AllowPlugins) {
            webView.setAttribute("plugins", "");
        }
        if (this.settings.AllowPopups) {
            webView.setAttribute("allowpopups", "");
        }
        webView.setAttribute("useragent", this.settings.UserAgent);
        webView.setAttribute("preload", "./bin/preload.js");
        if (this.settings.CaptureConsole) {
            webView.addEventListener("console-message", this.onWebViewConsoleMessage.bind(this), false);
        }
        webView.addEventListener("did-start-loading", this.onWebViewDidStartLoading.bind(this), false);
        webView.addEventListener("did-fail-load", this.onWebViewDidFailLoad.bind(this), false);
        // webView.addEventListener("did-finish-load", this.onWebViewDidFinishLoad.bind(this), false);
        webView.addEventListener("did-stop-loading", this.onWebViewDidStopLoading.bind(this), false);
        // webView.addEventListener("dom-ready", this.onWebViewDOMReady.bind(this), false);
        webView.addEventListener("did-navigate", this.onWebViewDidNavigate.bind(this), false);
        webView.addEventListener("did-navigate-in-page", this.onWebViewDidNavigateInPage.bind(this), false);
        webView.addEventListener("page-title-updated", this.onWebViewPageTitleUpdated.bind(this), false);
        webView.addEventListener("update-target-url", this.onWebViewUpdateTargetURL.bind(this), false);
        webView.addEventListener("ipc-message", this.onWebViewIPCMessage.bind(this), false);
        return webView;
    }

    /**
     * Handles IPC messages from the main process.
     * @param _event An Electron event.
     * @param args The arguments sent by the main process.
     */
    private onIPCFromMain(_event: Electron.IpcRendererEvent, ...args: unknown[]): void {
        const msgId: number = args[0] as number;
        const params: unknown[] = args.slice(1);
        switch (msgId) {
            case IPC.WINDOW_CREATED:
                this.windowID = params[0] as number;
                // This is the earliest possible moment to tell the main process once, that this renderer is ready.
                this.setRendererReady();
                break;

            default:
                console.warn(format("Unknown/unhandled IPC message received from main: %d. ", msgId, ...params));
                break;
        }
    }

    /**
     * Handles IPC messages from the web view. Communication is asynchronous.
     * - It stores the current scroll offset from the web view. This is the result
     *   from sending "getScrollOffset" to the web view.
     * - It receives any keyboard event from the web view and dispatches it to this
     *   browser window which then can handlie it with Mousetrap.
     * @param event An Electron IpcMessageEvent.
     */
    private onWebViewIPCMessage(event: Electron.IpcMessageEvent): void {
        if (event.channel !== IPC_WEBVIEW_RENDERER) {
            return;
        }
        const msgId = event.args[0] as number;
        const params: unknown[] = event.args.slice(1);
        switch (msgId) {
            case IPC.SET_SCROLL_OFFSET:
                this.webViewScrollOffset.x = Number(params[0]);
                this.webViewScrollOffset.y = Number(params[1]);
                break;

            case IPC.KEYBOARD_EVENT:
                try {
                    document.dispatchEvent(new KeyboardEvent(
                        (params[0] as AnyObject).type as string,
                        (params[0] as AnyObject).dict as KeyboardEventInit),
                    );
                } catch (error) {
                    console.error(`Error handling KB event from webview: ${error}`);
                }
                break;

            default:
                console.warn(format("Unknown/unhandled IPC message received from webview: %d, %s. ", msgId, getIPCMessage(msgId).Text, ...params));
                break;
        }

    }
}
