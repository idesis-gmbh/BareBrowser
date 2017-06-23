import { ipcRenderer, remote } from "electron";
import { $Path } from "../shared/Modules";
import * as $Settings from "../shared/Settings";
import * as $URLItem from "../shared/URLItem";
import * as $ShortCuts from "mousetrap";

export class CRendererApplication {

    private settings: $Settings.Settings;
    private addressBar: HTMLDivElement;
    private goBackButton: HTMLButtonElement;
    private goForwardButton: HTMLButtonElement;
    private urlField: HTMLInputElement;
    private webView: Electron.WebviewTag;

    /**
     *
     */
    constructor() {
        this.settings = $Settings.getSettings($Path.join(__dirname, "res", "settings.json"));
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
        this.queryInitialURLItem();
        this.bindShortCuts();
    }

    /**
     *
     */
    private queryInitialURLItem(): void {
        const urlItem = ipcRenderer.sendSync("IPC", ["queryURLItem"]);
        if ((urlItem && (urlItem as $URLItem.URLItem).DoLoad)) {
            this.webView.setAttribute("src", (urlItem as $URLItem.URLItem).URL);
        } else {
            this.addressBar.style.display = "";
            this.urlField.focus();
       }
    }

    /**
     *
     * @param shortcut
     * @param func
     */
    private bindShortCut(shortcut: string, func: Function): void {
        if (shortcut.trim() !== "") {
            $ShortCuts.bind(shortcut, (_event: ExtendedKeyboardEvent, _combo: string): boolean => {
                func.call(this);
                return false;
            });
        }
    }

    /**
     *
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
        });
        this.bindShortCut(this.settings.ShortCuts.InternalReload, () => {
            remote.getCurrentWindow().webContents.reload();
        });
        this.bindShortCut(this.settings.ShortCuts.Reload, () => {
            this.webView.reload();
        });
        this.bindShortCut(this.settings.ShortCuts.GoBack, () => {
            this.webView.goBack();
        });
        this.bindShortCut(this.settings.ShortCuts.GoForward, () => {
            this.webView.goForward();
        });
    }

    /**
     *
     * @param _event
     */
    private goBack(_event: MouseEvent): void {
        this.webView.goBack();
    }

    /**
     *
     * @param _event
     */
    private goForward(_event: MouseEvent): void {
        this.webView.goForward();
    }

    /**
     *
     * @param event
     */
    private loadURLItem(event: MouseEvent | KeyboardEvent): void {
        if ((event.type === "keypress") && ((event as KeyboardEvent).key !== "Enter")) {
            return;
        }
        this.webView.setAttribute("src", $URLItem.getURLItem(this.urlField.value).URL);
    }

    /**
     *
     * @param _event
     */
    private onLoadCommit(_event: Electron.LoadCommitEvent): void {
        this.goBackButton.disabled = !this.webView.canGoBack();
        this.goForwardButton.disabled = !this.webView.canGoForward();
    }

    /**
     *
     * @param _event
     */
    private onDidFinishLoad(_event: Electron.Event): void {
        this.urlField.value = this.webView.getURL();
        if (!this.webView.getWebContents().isFocused()) {
            this.webView.focus();
        }
    }

    /**
     *
     * @param event
     */
    private onPageTitleUpdated(event: Electron.PageTitleUpdatedEvent): void {
        remote.getCurrentWindow().setTitle(event.title);
    }

    /**
     *
     * @param event
     */
    private onConsoleMessage(event: Electron.ConsoleMessageEvent): void {
        //console.log(`LOG from ${this.webView.getURL()}: [Level ${event.level}] ${event.message} (Line ${event.line} in ${event.sourceId})`);
        console.log("LOG from %s: [Level %d] %s (Line %d in %s)", this.webView.getURL(), event.level, event.message, event.line, event.sourceId);
        event.preventDefault();
        event.stopImmediatePropagation();
        //$FSE.
    }

    /**
     *
     * @param _webContents
     * @param permission
     * @param callback
     */
    private onPermissionRequest(_webContents: Electron.WebContents, permission: string, callback: (permissionGranted: boolean) => void): void {
        const grant = (this.settings.Permissions.indexOf(permission) > -1);
        console.info(`Permission '${permission}' requested, ${grant ? "granting." : "denying."}`);
        callback(grant);
    }

    /**
     *
     * @param _event
     * @param args
     */
    // tslint:disable-next-line:no-any
    private onIPC(_event: Electron.Event, ...args: any[]): void {
        if ((args.length === 0) || (!this.webView)) {
            return;
        }
        switch (args[0][0]) {
            case "loadURLItem":
                if (args[0].length === 2) {
                    this.webView.setAttribute("src", (args[0][1] as $URLItem.URLItem).URL);
                }
                break;

            case "toggleAddressBar":
                this.addressBar.style.display === "none" ? this.addressBar.style.display = "" : this.addressBar.style.display = "none";
                break;

            case "toggleInternalDevTools":
                const devToolsOpened = remote.getCurrentWindow().webContents.isDevToolsOpened();
                devToolsOpened ? remote.getCurrentWindow().webContents.closeDevTools() : remote.getCurrentWindow().webContents.openDevTools({mode: "detach"});
                break;

            case "toggleDevTools":
                this.webView.isDevToolsOpened() ? this.webView.closeDevTools() : this.webView.openDevTools();
                break;

            case "internalReload":
                remote.getCurrentWindow().webContents.reload();
                break;

            case "reload":
                this.webView.reload();
                break;

            case "goBack":
                this.webView.goBack();
                break;

            case "goForward":
                this.webView.goForward();
                break;

            default:
                break;
        }
    }

    /**
     *
     * @returns HTMLDivElement
     */
    private getAddressBar(): HTMLDivElement {
        const addressBar: HTMLDivElement = document.createElement("div");
        addressBar.setAttribute("id", "addressBar");
        // Initially hidden; made visible depending on command line params
        addressBar.style.display = "none";
        return addressBar;
    }

    /**
     *
     * @returns HTMLDivElement
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
        goButton.addEventListener("click", this.loadURLItem.bind(this), false);
        navigationButtonsContainer.appendChild(goButton);

        return navigationButtonsContainer;
    }

    /**
     *
     * @returns HTMLDivElement
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
        this.urlField.addEventListener("keypress", this.loadURLItem.bind(this), false);
        urlFieldContainer.appendChild(this.urlField);
        return urlFieldContainer;
    }

    /**
     *
     * @returns Electron.WebviewTag
     */
    private getWebView(): Electron.WebviewTag {
        const webView: Electron.WebviewTag = document.createElement("webview");
        webView.setAttribute("id", "webView");
        webView.setAttribute("autosize", "");
        webView.setAttribute("plugins", "");
        webView.setAttribute("useragent", this.settings.UserAgent);
        webView.addEventListener("load-commit", this.onLoadCommit.bind(this), false);
        webView.addEventListener("did-finish-load", this.onDidFinishLoad.bind(this), false);
        webView.addEventListener("page-title-updated", this.onPageTitleUpdated.bind(this), false);
        webView.addEventListener("console-message", this.onConsoleMessage.bind(this), false);
        return webView;
    }

}
