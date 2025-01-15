import { spawn } from "child_process";
import { app, BrowserWindow, ContextMenuParams, dialog, ipcMain, Menu, MenuItem, protocol, Rectangle, screen, session, webContents } from "electron";
import { HandlerDetails } from "electron/main";
import { APP_INFO } from "../shared/AppInfo";
import * as $Consts from "../shared/Consts";
import { IPC, IPC_MAIN_RENDERER } from "../shared/IPC";
import { $FSE, $Path, $URL } from "../shared/Modules";
import * as $Settings from "../shared/Settings";
import { AnyObject } from "../shared/Types";
import { getURLItem, isSameOrigin, IURLItem } from "../shared/URLItem";
import { format, getDirectoryListing, getMimeTypeFromFileExtension, IDirectoryListing, MIME_TYPES } from "../shared/Utils";
import { ApplicationMenu } from "./ApplicationMenu";
import { DarwinMenu } from "./DarwinMenu";
import { LinuxWin32Menu } from "./LinuxWin32Menu";
import { NavigationType, RequestHandler, RequestResult } from "./RequestHandler";

/**
 * Primitive command-line object.
 */
interface ICmdLineArgs {
    /** Url to be opened. */
    URL: string;
    /** Id of target window. */
    WindowID: number;
}

/**
 * Holds a BrowserWindow, the webContents of the webview tag hosted by the browser window
 * and a group of request handlers.
 */
interface IWindowEntry {
    /* eslint-disable jsdoc/require-jsdoc */
    Window: Electron.BrowserWindow;
    WebViewWebContents: Electron.WebContents;
    WebViewWebContentsID: number;
    RequestHandlers: RequestHandler[];
    /* eslint-enable */
}

/**
 * Class that holds an instance of a browser window.
 */
class Renderer {
    private window: BrowserWindow;

    /**
     * Create renderer with a browser window.
     * @param owner The instance of `MainApplication` that owns this renderer.
     * @param bwOptions Options for creating the browser window.
     */
    constructor(
        private owner: MainApplication,
        private bwOptions: Electron.BrowserWindowConstructorOptions
    ) {
        this.window = new BrowserWindow(this.bwOptions);
        this.window.on("focus", () => this.owner.onWindowFocus(this.window));
        this.window.on("close", () => this.owner.onWindowClose(this.window));
        this.window.on("closed", () => this.owner.onWindowClosed(this.window));
        this.window.webContents.on("context-menu", (ev: Electron.Event, params: ContextMenuParams) => {
            ev.preventDefault();
            this.owner.onRendererPopupMenu(this.window.webContents, params);
        });
    }

    /**
     * Get the browser window of this renderer instance.
     */
    public get Window(): BrowserWindow {
        return this.window;
    }
}

/**
 * The class for the main application part. Only one instamce will be created.
 */
export class MainApplication {
    private appURLPath = APP_INFO.Platform === "win32" ? `file:///${APP_INFO.APP_PATH.replaceAll("\\", "/")}` : `file://${APP_INFO.APP_PATH}`;
    private userDataDirectory: string;
    private tempDir: string;
    private settingsFile: string;
    private settingsTemplateFile: string;
    private settings: $Settings.ISettings;
    private currentUrlItem: IURLItem;
    private appMenu: ApplicationMenu | null = null;
    private windows: IWindowEntry[] = [];
    private lastClosedWindowBounds: Rectangle;
    private lastClosedWindowState: -1 | 0 | 1 | 2;

    /**
     * Boot and set up Electron app.
     */
    constructor() {
        // Must be done as early as possible and before getSettings()!
        this.setAppPaths(APP_INFO.IdentifierRoot, APP_INFO.Identifier);
        this.settings = this.getSettings();
        this.getInitialURLItem();
        // Issued by another instance which is about to quit.
        if (this.currentUrlItem.URL == $Consts.CMD_CLEAR_TRACES) {
            setTimeout(() => {
                this.clearTraces();
                this.quit();
            }, 1000);
            //}, APP_INFO.Platform === "win32" ? 1000 : 100);
            return;
        }
        // Next, check if another instance is aleady running.
        if (app.requestSingleInstanceLock()) {
            // No other instance is running, in this case release the lock again unless the
            // configuration demands single instance mode.
            if (!this.settings.SingleInstance) {
                app.releaseSingleInstanceLock();
            }
        } else {
            // Another instance is already running, so just leave a message here and quit.
            // Note: additional config checking is done in the other instance.
            if (process.argv.length === 1) {
                console.info("Additional instance without params, quitting.");
            } else {
                const cmdLineArgs = this.parseArgs(process.argv);
                console.info("Additional instance, passing URL '%s' and WindowID '%s' to current instance and quitting.", cmdLineArgs.URL, cmdLineArgs.WindowID);
            }
            this.settings.ClearTraces = false;
            app.quit();
            return;
        }
        this.preAppReadySetup();
    }

    /**
     * Parse command line parameters.
     * @param args Parse command line arguments
     * @returns An object with the URL to be opened and an optional target window id.
     */
    private parseArgs(args: string[]): ICmdLineArgs {
        args = args.filter(entry => entry !== "--allow-file-access-from-files").slice(1);
        let URL: string;
        let windowId: number = parseInt(args[args.length - 1]);
        if (isNaN(windowId)) {
            URL = args[args.length - 1];
            windowId = -1;
        } else {
            URL = args[args.length - 2];
            // Single window mode, ignore window id.
            if ((!this.settings.AllowNewWindows) || (windowId < 1)) {
                windowId = -1;
            }
        }
        if (!URL) {
            URL = "";
        } else if (APP_INFO.Platform === "win32") {
            // Workaround for several problems with command-line handling in onSecondInstance on Windows.
            URL = URL
                .trim()
                .replace(/^"/, "")
                .replace(/^'/, "")
                .replace(/"$/, "")
                .replace(/'$/, "");
        }
        /* eslint-disable jsdoc/require-jsdoc */
        return <ICmdLineArgs>{
            URL: URL,
            WindowID: Math.trunc(windowId)
        };
        /* eslint-enable */
    }

    /**
     * Quit application.
     */
    public quit(): void {
        app.quit();
    }

    /**
     * Create a browser window.
     * @param behindCurrent If `true`, the window will be created behind the current topmost window.
     * @returns The newly created browser windows.
     */
    private async createWindow(behindCurrent = false): Promise<BrowserWindow> {
        const lastWinPos = this.settings.Window.LastWindowPosition;
        const placeFirstWindow = lastWinPos.Restore && this.windows.length === 0;
        console.log("Creating new window...");
        /* eslint-disable jsdoc/require-jsdoc */
        const bwOptions: Electron.BrowserWindowConstructorOptions = {
            webPreferences: {
                nodeIntegration: true,
                webviewTag: true,
                contextIsolation: false,
            },
            show: !behindCurrent,
            icon: APP_INFO.Platform === "linux"
                ? $Path.join(APP_INFO.APP_PATH_PKG, "dockicon.png")
                : undefined,
        };
        /* eslint-enable */
        // Place first window?
        if (placeFirstWindow) {
            bwOptions.x = lastWinPos.Left;
            bwOptions.y = lastWinPos.Top;
            bwOptions.width = lastWinPos.Width;
            bwOptions.height = lastWinPos.Height;
        } else {
            // New window with offset to latest current window
            const currentWindow = this.getCurrentWindow();
            const currentScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
            if (currentWindow && this.settings.Window.NewRelativeToCurrent) {
                bwOptions.x = currentWindow.getBounds().x + 25;
                bwOptions.y = currentWindow.getBounds().y + 25;
            } else if (this.settings.Window.LeftTopOfCurrentScreen) {
                // New window on current screen (the screen with the mouse cursor inside it)
                bwOptions.x = currentScreen.bounds.x + this.settings.Window.Left;
                bwOptions.y = currentScreen.bounds.y + this.settings.Window.Top + currentScreen.workArea.y;
            } else {
                // Default
                bwOptions.x = this.settings.Window.Left;
                bwOptions.y = this.settings.Window.Top + currentScreen.workArea.y;
            }
            bwOptions.width = this.settings.Window.Width;
            bwOptions.height = this.settings.Window.Height;
        }
        // Create a renderer instance with a browser window ...
        const renderer: Renderer = new Renderer(this, bwOptions);
        if (placeFirstWindow) {
            if (lastWinPos.State === 2) {
                renderer.Window.setFullScreen(true);
            } else if (lastWinPos.State === 1) {
                renderer.Window.maximize();
            } else if (lastWinPos.State === -1) {
                renderer.Window.minimize();
            }
        }
        renderer.Window.setContentProtection(this.settings.ContentProtection);
        // ... and load index.html.
        const urlObject: $URL.UrlObject = {
            /* eslint-disable jsdoc/require-jsdoc */
            pathname: $Path.join(__dirname, "..", "index.html"),
            protocol: "file:",
            slashes: true,
            /* eslint-enable */
        };
        // Set title to product name from ../package.json
        this.setWindowTitle(renderer.Window, APP_INFO.ProductName);
        // Load initial URL.
        await renderer.Window.loadURL($URL.format(urlObject));
        if (behindCurrent) {
            const current = BrowserWindow.getFocusedWindow();
            if (current) {
                renderer.Window.showInactive();
                current.moveTop();
                this.setForegoundWindow(current);
            } else {
                // Safe fallback
                renderer.Window.show();
            }
        }
        // Tell renderer its own window id.
        renderer.Window.webContents.send(IPC_MAIN_RENDERER, IPC.WINDOW_CREATED, renderer.Window.id);
        console.log("Creating new window done.");
        return renderer.Window;
    }

    /**
     * Create user data and temp directory.
     * @param appIdentifierParent Optional additional parent directory for user data.
     * @param appIdentifier The apps identifier.
     */
    private setAppPaths(appIdentifierParent: string, appIdentifier: string): void {
        // Unfortunately this is created too early, so it must be deleted later.
        const initialUserDataDir = $Path.join(app.getPath("userData"));
        // An application name from 'package.json' may be too short to be unambigous and therefore
        // could lead to conflicts in ~/Library/Application Support/ or %APPDATA%, so the value of
        // 'identifier' from the apps package.json is used instead.
        this.userDataDirectory = $Path.join(app.getPath("userData"), "..", appIdentifierParent, appIdentifier);
        this.tempDir = $Path.join(this.userDataDirectory, "temp");
        this.settingsFile = $Path.join(this.userDataDirectory, "settings.json");
        // Lookup settings template file. Packaging could have been configured to put everything
        // inside app.asar, so the real file location can only be determined at runtime.
        if ($FSE.existsSync($Path.join(APP_INFO.RES_PATH, "settings.json"))) {
            this.settingsTemplateFile = $Path.join(APP_INFO.RES_PATH, "settings.json");
        } else if ($FSE.existsSync($Path.join(APP_INFO.RES_PATH_PKG, "settings.json"))) {
            this.settingsTemplateFile = $Path.join(APP_INFO.RES_PATH_PKG, "settings.json");
        } else {
            this.settingsTemplateFile = "";
        }
        // Paths must be available, thus synced.
        $FSE.mkdirpSync(this.tempDir); // Implicitly creates this.userDataDirectory
        app.setAppLogsPath(this.tempDir);
        app.setPath("userData", this.userDataDirectory);
        app.setPath("temp", this.tempDir);
        // Remove initial user data dir
        $FSE.removeSync(initialUserDataDir);
        // Augment APP_INFO
        // @ts-ignore
        APP_INFO.UserDataDir = this.userDataDirectory;
    }

    /**
     * Load app settings.
     * @returns The loaded app settings.
     */
    private getSettings(): $Settings.ISettings {
        let result = $Settings.getDefaultSettings();
        let hasUserSettings = false;
        try {
            // First, update existing user settings from the template or create
            // them, if they don't exist. Only possible, if a template exists.
            if ($FSE.existsSync(this.settingsTemplateFile)) {
                // There are no user settings, create them from the template.
                if (!$FSE.existsSync(this.settingsFile)) {
                    $FSE.copyFileSync(this.settingsTemplateFile, this.settingsFile);
                }
                // If the template is newer than the user settings merge them with the template.
                else if ($FSE.statSync(this.settingsTemplateFile).mtime > $FSE.statSync(this.settingsFile).mtime) {
                    // Make backup.
                    const backupFilename: string = $Path.join(
                        this.userDataDirectory,
                        "settings-"
                        + new Date().toISOString().replace("T", "_").replace(/:/g, "-").replace(/.[0-9]{3}Z/g, "")
                        + ".json");
                    $FSE.copyFileSync(this.settingsFile, backupFilename);
                    // Merge settings from potentially new settings (with different properties) to
                    // the current settings and save them. This is done with raw file read methods
                    // since `getSettings` applies numerous checks and modifies the loaded JSON if
                    // necessary.
                    const currentSettings = $FSE.readJSONSync(this.settingsFile) as $Settings.ISettings;
                    const templateSettings = $FSE.readJSONSync(this.settingsTemplateFile) as $Settings.ISettings;
                    $Settings.mergeSettings(templateSettings, currentSettings);
                    $FSE.writeJSONSync(this.settingsFile, currentSettings, { spaces: 4 }); // eslint-disable-line jsdoc/require-jsdoc
                }
                hasUserSettings = true;
            }
            // Get/use new/current settings.
            if (hasUserSettings || $FSE.existsSync(this.settingsFile)) {
                result = $Settings.getSettings(this.settingsFile);
            } else {
                // Create default settíngs
                $FSE.writeJSONSync(this.settingsFile, result, { spaces: 4 }); // eslint-disable-line jsdoc/require-jsdoc
            }
        } catch (error) {
            console.error("Could't update and/or read user settings.", error);
        }
        return result;
    }

    /**
     * Get initial URL to be loaded (if any).
     */
    private getInitialURLItem(): void {
        const cmdLineArgs = this.parseArgs(process.argv);
        if (cmdLineArgs.URL === "") {
            this.currentUrlItem = getURLItem("", this.settings.Scheme);
        } else {
            const testURL = cmdLineArgs.URL.startsWith("new:")
                ? cmdLineArgs.URL.substring(4)
                : cmdLineArgs.URL;
            // on startupt these commands don't make sense, ignore.
            if ([
                `${this.settings.Scheme}://reload`,
                `${this.settings.Scheme}://back`,
                `${this.settings.Scheme}://forward`,
                `${this.settings.Scheme}://close`
            ].includes(this.handleBuiltinURLs(testURL))) {
                cmdLineArgs.URL = "";
            }
            this.currentUrlItem = getURLItem(this.handleBuiltinURLs(cmdLineArgs.URL), this.settings.Scheme);
        }
    }

    /**
     * Bind event handlers.
     */
    private bindEvents(): void {
        // App events
        ipcMain.on(IPC_MAIN_RENDERER, this.onIPCMain.bind(this));
        app.once("ready", this.onAppReady.bind(this));
        app.once("before-quit", this.onBeforeQuit.bind(this));
        app.once("quit", this.onQuit.bind(this));
        app.on("activate", this.onActivate.bind(this));
        app.on("second-instance", this.onSecondInstance.bind(this)); // eslint-disable-line @typescript-eslint/no-misused-promises
        app.on("open-url", this.onOpenURL.bind(this));
        app.on("open-file", this.onOpenFile.bind(this));
        app.on("web-contents-created", this.onWebContentsCreated.bind(this));
    }

    /**
     * Create and install a basic menu depending on the current platform.
     */
    private setApplicationMenu(): void {
        if (APP_INFO.Platform === "darwin") {
            this.appMenu = new DarwinMenu(this, this.settings, APP_INFO.ProductName);
            Menu.setApplicationMenu(this.appMenu.Menu);
        } else if (["linux", "win32"].includes(APP_INFO.Platform)) {
            switch (this.settings.MenuState) {
                // No menu for Linux/Windows allowed
                case 0:
                    Menu.setApplicationMenu(null);
                    break;
                // Menu for Linux/Windows allowed but initially hidden
                case 1:
                    this.appMenu = new LinuxWin32Menu(this, this.settings, APP_INFO.ProductName);
                    Menu.setApplicationMenu(null);
                    break;
                // Allow and show menu for Linux/Windows
                case 2:
                    this.appMenu = new LinuxWin32Menu(this, this.settings, APP_INFO.ProductName);
                    Menu.setApplicationMenu(this.appMenu.Menu);
                    break;
            }
        }
    }

    /**
     * Load request handlers configured in settings.
     * @param webContents The webContens used for loading pages.
     * @param browserWindow The browser window which hosts the webContents (of the WebView tag).
     * @returns An array of available request handler instances.
     */
    private loadRequestHandlers(webContents: Electron.WebContents, browserWindow: BrowserWindow): RequestHandler[] {
        const handlers = [];
        for (const handler of this.settings.RequestHandlers) {
            if (!handler.Load) {
                continue;
            }
            try {
                let requestHandlerSource: string;
                if ($Path.isAbsolute(handler.Source)) {
                    requestHandlerSource = handler.Source;
                } else {
                    // First, load from real file system
                    requestHandlerSource = $Path.resolve(APP_INFO.APP_PATH, handler.Source);
                    if (!$FSE.existsSync(requestHandlerSource)) {
                        // Next, try to load from file system inside app.asar
                        requestHandlerSource = $Path.resolve(APP_INFO.APP_PATH_PKG, handler.Source);
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const handlerClass: typeof RequestHandler = require(requestHandlerSource) as typeof RequestHandler;
                const classInstance: RequestHandler = new handlerClass(
                    handler.Config,
                    this.settings,
                    handler.Active,
                    webContents,
                    browserWindow,
                );
                classInstance.IsActive = handler.Active;
                handlers.push(classInstance);
            } catch (error) {
                console.error(`Error loading URL handler from: ${handler.Source}\n${error as Error}`);
            }
        }
        return handlers;
    }

    /**
     * Setup *before* app is ready.
     */
    private preAppReadySetup(): void {
        this.bindEvents();
        for (const flag of this.settings.ElectronFlags) {
            const index = flag.indexOf("=");
            if (index > -1) {
                app.commandLine.appendSwitch(flag.substring(0, index), flag.substring(index + 1));
            } else {
                // `appendArgument` doesn't seem to work?
                app.commandLine.appendSwitch(flag);
            }
        }
        if (!this.settings.HardwareAcceleration) {
            app.disableHardwareAcceleration();
        }
        // The docs don't state that this is necessary, but without it Electron will hang on the first request.
        /* eslint-disable jsdoc/require-jsdoc */
        protocol.registerSchemesAsPrivileged([
            {
                scheme: this.settings.Scheme, privileges:
                {
                    standard: true,
                    secure: true,
                    stream: true, // !!
                    // bypassCSP: true,
                    // supportFetchAPI: true,
                }
            },
        ]);
        /* eslint-enable */
    }

    /**
     * Setup *after* app is ready. Most other settings must be applied earlier.
     */
    private postAppReadySetup(): void {
        this.setApplicationMenu();
        app.setAboutPanelOptions({
            /* eslint-disable jsdoc/require-jsdoc */
            applicationName: APP_INFO.ProductName,
            applicationVersion: APP_INFO.Version,
            copyright: `${APP_INFO.Copyright}, ${APP_INFO.CompanyName}`,
            authors: [APP_INFO.AuthorName],
            website: APP_INFO.Homepage,
            iconPath: APP_INFO.APP_PATH_PKG + "appicon.png"
            /* eslint-enable */
        });
        // Handlers on the default session.
        session.defaultSession.setPermissionRequestHandler(this.onPermissionRequest.bind(this));
        session.defaultSession.webRequest.onBeforeRequest(this.onBeforeRequest.bind(this));
        // Handle own protocol.
        this.registerCustomProtocol();
    }

    /**
     * Remove all temporary data like caches, cookies etc. but keep the settings file.
     */
    private clearTraces(): void {
        const userDataFiles: IDirectoryListing = getDirectoryListing(this.userDataDirectory, true);
        // Exclude settings.json and backups of it
        const regExp = new RegExp("([\\/|\\\\]{1}settings-[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}-[0-9]{2}\\.json)$");
        userDataFiles.Files = userDataFiles.Files.filter((fileName: string): boolean => {
            return !(fileName === this.settingsFile || regExp.test(fileName));
        });
        const leftOvers: IDirectoryListing = { Directories: [], Files: [] }; // eslint-disable-line jsdoc/require-jsdoc
        // First remove files...
        for (const entry of userDataFiles.Files) {
            try {
                $FSE.removeSync(entry);
            } catch (error) {
                leftOvers.Files.push(entry);
            }
        }
        // ... then directories (deepest first)
        userDataFiles.Directories.sort((a: string, b: string) => { return b.length - a.length; });
        for (const entry of userDataFiles.Directories) {
            try {
                $FSE.removeSync(entry);
            } catch (error) {
                leftOvers.Directories.push(entry);
            }
        }
        if ((leftOvers.Directories.length > 0) || (leftOvers.Files.length > 0)) {
            console.warn(`Clearing traces has the following leftovers: ${JSON.stringify(leftOvers, null, 2)}`);
        }
    }

    /**
     * Move the given window to the foreground (make it the last entry in the internal window list).
     * __Note:__ This doesn't focus the window.
     * @param window The window to be moved to the foreground.
     */
    private setForegoundWindow(window: BrowserWindow) {
        const index: number = this.windows.findIndex(entry => entry.Window === window);
        if (index !== -1) {
            this.windows.push(this.windows.splice(index, 1)[0]);
        }
    }

    /**
     * Get (last) focused window from the internal window list.
     * @returns The focused window or last focused window or undefined (should never happen).
     */
    public getCurrentWindow(): Electron.BrowserWindow | undefined {
        return this.windows.at(-1)?.Window;
    }

    /**
     * Get an entry from the internal window list by a browser window id.
     * @param windowId The id of a browser window. If the id isn't defined, the id of topmost window
     * will be used.
     * @returns An entry from the internal window list or undefined.
     */
    private getBrowserWindowEntry(windowId: number | undefined): IWindowEntry | undefined {
        if (windowId === undefined) {
            const currentWindow = this.getCurrentWindow();
            return currentWindow
                ? this.windows[this.windows.findIndex(entry => entry.Window?.id === currentWindow.id)]
                : undefined;
        }
        return this.windows[this.windows.findIndex(entry => entry.Window?.id === windowId)];
    }

    /**
     * Set window title with numeric prefix ([<window id>]  )
     * @param window The Browser window to set the title for.
     * @param title The new window title.
     */
    private setWindowTitle(window: BrowserWindow | undefined, title: string): void {
        if (window) {
            this.settings.AllowNewWindows
                ? window.setTitle(`[${window.id}]  ${title}`)
                : window.setTitle(title);
        }
    }

    /**
     * Transform builtin URLs like `info:*`, `./out/` etc.
     * @param url The URL to be transformed.
     * @returns The transformed URL.
     */
    private handleBuiltinURLs(url: string): string {
        // Workaround for several problems with command-line handling in onSecondInstance on Windows.
        if (APP_INFO.Platform === "win32") {
            url = url
                .trim()
                .replace(/^"/, "")
                .replace(/^'/, "")
                .replace(/"$/, "")
                .replace(/'$/, "");
        }
        // Don't load this URL during development.
        if (((url === "./out/") || ((url === "./out"))) && !APP_INFO.IsPackaged) {
            return "";
        } else if (url.startsWith("new:")) {
            // Strip new:
            url = url.substring(4);
        }
        switch (url) {
            case "home:":
                return `${this.settings.Scheme}://home`;
            case "settings:":
                return `${this.settings.Scheme}://settings`;
            case "info:":
                return `${this.settings.Scheme}://info`;
            case "readme:":
                return `${this.settings.Scheme}://readme`;
            case "readme.md:":
                return `${this.settings.Scheme}://readme.md`;
            case "license:":
                return `${this.settings.Scheme}://license`;
            case "changes:":
                return `${this.settings.Scheme}://changes`;
            case "reload:":
                return `${this.settings.Scheme}://reload`;
            case "back:":
                return `${this.settings.Scheme}://back`;
            case "forward:":
                return `${this.settings.Scheme}://forward`;
            case "close:":
                return `${this.settings.Scheme}://close`;
            default:
                return url;
        }
    }

    /**
     * Called on Darwin by the two `onOpen` events. Gets the current window and loads the given URL
     * in it.
     * @param fileOrURL The URL (or file) to be loaded.
     * @param isFile Indicates whether the given URL is a local file or not.
     * @param browserWindow The browser window which should handle the given URL.
     */
    private openFileOrURL(fileOrURL: string, isFile: boolean, browserWindow?: BrowserWindow | null): void {
        this.currentUrlItem = getURLItem(this.handleBuiltinURLs(fileOrURL), this.settings.Scheme);
        // On Darwin yet determined by onOpen* so set it explicitly here
        this.currentUrlItem.IsFileURL = isFile;
        const targetWindow = browserWindow ? browserWindow : this.getCurrentWindow();
        if (!targetWindow) {
            return;
        }
        // Quit command received
        if (this.currentUrlItem.URL === $Consts.CMD_QUIT) {
            app.quit();
            return;
        }
        if (this.settings.FocusOnNewURL) {
            targetWindow.focus();
            // eslint-disable-next-line jsdoc/require-jsdoc
            app.focus({ steal: APP_INFO.Platform === "darwin" && this.settings.DarwinForceFocus });
        }
        const windowEntry = this.getBrowserWindowEntry(targetWindow.id);
        if (windowEntry) {
            this.handleRequest(this.currentUrlItem.URL, this.currentUrlItem.OriginalURL, windowEntry.WebViewWebContentsID, NavigationType.LOAD);
        }
    }

    /**
     * Called by Electron app if another instance was started. This either loads the given URL in
     * the current instance or quits the running instance by the special `quit` URL.
     * @param _event An Electron event.
     * @param args The arguments passed to the instance started elsewhere.
     * @param _workingDirectory The working directory of the instance started elsewhere.
     */
    private async onSecondInstance(_event: Electron.Event, args: string[], _workingDirectory: string): Promise<void> {
        const cmdLineArgs = this.parseArgs(args);
        // Open in new window?
        const newWindow = this.settings.AllowNewWindows && cmdLineArgs.URL.startsWith("new:");
        this.currentUrlItem = getURLItem(this.handleBuiltinURLs(cmdLineArgs.URL), this.settings.Scheme);
        if (this.currentUrlItem.URL === $Consts.CMD_QUIT) {
            // Must be done asynchronously, otherwise a new instance would be started.
            setTimeout(() => { app.quit(); }, 500);
            return;
        }
        let targetWindow: BrowserWindow | undefined;
        if (newWindow) {
            // new: with these commands doesn't make sense, ignore.
            if ([
                `${this.settings.Scheme}://reload`,
                `${this.settings.Scheme}://back`,
                `${this.settings.Scheme}://forward`,
                `${this.settings.Scheme}://close`
            ].includes(this.currentUrlItem.URL)) {
                console.log(`Ignoring ${this.currentUrlItem.URL} on second instance.`);
                return;
            }
            targetWindow = await this.createWindow();
        } else if (cmdLineArgs.WindowID > 0) { // Future features, enable negative values?
            targetWindow = this.getBrowserWindowEntry(cmdLineArgs.WindowID)?.Window;
        } else {
            // Use current window
            targetWindow = this.getCurrentWindow();
        }
        // Not found, ignore
        if (!targetWindow) {
            console.log(`Window id ${cmdLineArgs.WindowID} not found, ignoring.`);
            return;
        }
        // Move the target window to the front in the internal window list. This doesn't focus
        // the window but when handling internal URLs the correct window will be grabbed in the
        // stream protocol handler and custom window titles will be set correctly.
        this.setForegoundWindow(targetWindow);
        // Also move window to the top, regardless of focus.
        // In the future this may also be configurable.
        targetWindow.moveTop();
        // Set focus, if configured.
        if (this.settings.FocusOnNewURL) {
            targetWindow.focus();
            // eslint-disable-next-line jsdoc/require-jsdoc
            app.focus({ steal: APP_INFO.Platform === "darwin" && this.settings.DarwinForceFocus });
        }
        if (cmdLineArgs.URL !== "") {
            const windowEntry = this.getBrowserWindowEntry(targetWindow.id);
            if (windowEntry) {
                this.handleRequest(this.currentUrlItem.URL, this.currentUrlItem.OriginalURL, windowEntry.WebViewWebContentsID, NavigationType.LOAD);
            }
        }
    }

    /**
     * Called on Darwin when the app is started with 'open' and a URL.
     * @param event An Electron event
     * @param url The URL to be opened.
     */
    private onOpenURL(event: Electron.Event, url: string): void {
        event.preventDefault();
        this.openFileOrURL(url, false);
    }

    /**
     * Called on Darwin when the app is started with 'open' and a file.
     * @param event An Electron event
     * @param fileName The file to be loaded.
     */
    private onOpenFile(event: Electron.Event, fileName: string): void {
        event.preventDefault();
        this.openFileOrURL(fileName, true);
    }

    /**
     * Various handlers for the webContents of the webview tag.
     * @param _event Electron event.
     * @param webContents The web contents of the renderer process.
     * @see https://www.electronjs.org/docs/tutorial/security
     */
    private onWebContentsCreated(_event: Electron.Event, webContents: Electron.WebContents): void {
        // Secure the webview tag.
        webContents.on("will-attach-webview", (_e: Electron.Event, wp: Electron.WebPreferences, _params: Record<string, string>): void => {
            // No longer works beginning with Electron 19.0.0
            // delete wp.preload;
            wp.backgroundThrottling = false;
            wp.nodeIntegration = false;
            wp.nodeIntegrationInSubFrames = false;
            wp.nodeIntegrationInWorker = false;
            wp.sandbox = true;
            wp.contextIsolation = false;
            wp.webSecurity = true;
            wp.experimentalFeatures = false;
            wp.enableBlinkFeatures = "";
            // wp.v8CacheOptions = "code";
            wp.allowRunningInsecureContent = false;
        });
        // A different URL origin will cause a new handler chain to be started (through openFileOrURL).
        webContents.on("will-navigate", (willNavigateEvent, url: string) => {
            const srcURL = willNavigateEvent.url;
            if (isSameOrigin(srcURL, url)) {
                if (this.settings.LogRequests) { console.log(`WILL-NAVIGATE from ${srcURL} to ${new $URL.URL(url).toString()}, same origin, passing`); }
            } else {
                if (this.settings.LogRequests) { console.log(`WILL-NAVIGATE from ${srcURL} to ${new $URL.URL(url).toString()}, different origin, starting new RequestHandler chain`); }
                willNavigateEvent.preventDefault();
                this.openFileOrURL(url, url.startsWith("file://"), BrowserWindow.fromWebContents(webContents));
            }
        });
        // Handle requests to open new windows. Since BareBrowser has no tabs (yet) new windows will
        // be created in all cases.
        webContents.setWindowOpenHandler((details: HandlerDetails) => {
            if (["default",
                // Link with target="_blank" etc. If AllowPopups is false, the setWindowOpenHandler
                // will never be called.
                "foreground-tab",
                // Cmd-/Ctrl-click
                "background-tab",
                // Shift-click
                "new-window",
                "save-to-disk",
                "other"].includes(details.disposition)) {
                this.currentUrlItem = getURLItem(this.handleBuiltinURLs(details.url), this.settings.Scheme);
                this.settings.AllowNewWindows
                    ? void this.createWindow(details.disposition === "background-tab")
                    : setImmediate(() => {
                        this.openFileOrURL(this.currentUrlItem.URL, this.currentUrlItem.IsFileURL);
                    });
            }
            // eslint-disable-next-line jsdoc/require-jsdoc
            return { action: "deny" };
        });
    }

    /**
     * Handles IPC calls from the renderer processes. Communication is asynchronous.
     * @param event The Electron event. Used to return values/objects back to the calling renderer
     * process (optional).
     * @param args The arguments sent by the calling renderer process.
     */
    private onIPCMain(event: Electron.IpcMainEvent, ...args: unknown[]): void {
        const windowId: number = args[0] as number;
        const msgId: number = args[1] as number;
        const params: unknown[] = args.slice(2);
        let windowEntry = this.getBrowserWindowEntry(windowId);
        // const ipcMessage = getIPCMessage(msgId);
        switch (<IPC>msgId) {
            case IPC.LOAD_URL:
                if (windowEntry) {
                    const loadURL = getURLItem(this.handleBuiltinURLs(params[0] as string), this.settings.Scheme);
                    // Must be patched to the original URL which is passed as `params[1]` by the
                    // the renderer process (it knows the correct value, see `setRendererReady`).
                    // Since the already parsed URL is fed into `getURLItem` it creates a wrong
                    // `OriginalURL` member.
                    loadURL.OriginalURL = params[1] as string;
                    this.handleRequest(loadURL.URL, loadURL.OriginalURL, windowEntry.WebViewWebContentsID, NavigationType.LOAD);
                }
                break;
            case IPC.RELOAD_URL:
                if (windowEntry) {
                    this.handleRequest("<RELOAD>", "<RELOAD>", windowEntry.WebViewWebContentsID, NavigationType.RELOAD);
                }
                break;
            case IPC.GO_BACK:
                if (windowEntry) {
                    if (windowEntry.WebViewWebContents.navigationHistory.canGoBack()) {
                        this.handleRequest("<BACK>", "<BACK>", windowEntry.WebViewWebContentsID, NavigationType.BACK);
                    }
                }
                break;
            case IPC.GO_FORWARD:
                if (windowEntry) {
                    if (windowEntry.WebViewWebContents.navigationHistory.canGoForward()) {
                        this.handleRequest("<FORWARD>", "<FORWARD>", windowEntry.WebViewWebContentsID, NavigationType.FORWARD);
                    }
                }
                break;
            // Return the initial URLItem
            case IPC.QUERY_INITIAL_URL_ITEM:
                event.returnValue = this.currentUrlItem;
                // Reset this item to an empty state to avoid reloading the initial URL
                // if SingelInstance is true *and* a new window is opened via command line.
                setTimeout(() => {
                    this.currentUrlItem.OriginalURL = "";
                    this.currentUrlItem.URL = "";
                    this.currentUrlItem.IsFileURL = false;
                    this.currentUrlItem.DoLoad = true;
                }, 100);
                break;
            // Return app settings
            case IPC.GET_SETTINGS:
                event.returnValue = this.settings;
                break;
            // Toggle main menu on Linux/Windows platforms
            case IPC.TOGGLE_MENU:
                if (["linux", "win32"].includes(APP_INFO.Platform) && (this.settings.MenuState > 0) && (this.appMenu)) {
                    Menu.getApplicationMenu() ? Menu.setApplicationMenu(null) : Menu.setApplicationMenu(this.appMenu.Menu);
                    event.returnValue = true;
                } else {
                    event.returnValue = false;
                }
                break;
            // Create and open a new window. The calling renderer process will
            // request the (new) URLItem to be opened with another IPC call.
            case IPC.NEW_WINDOW:
                const url: string = params[0] as string;
                event.returnValue = url !== undefined;
                if (url !== undefined) {
                    this.currentUrlItem = getURLItem(this.handleBuiltinURLs(url), this.settings.Scheme);
                    if (this.settings.AllowNewWindows) {
                        void this.createWindow();
                    } else {
                        this.openFileOrURL(this.currentUrlItem.URL, this.currentUrlItem.IsFileURL);
                    }
                }
                break;
            case IPC.TOGGLE_INTERNAL_DEV_TOOLS:
                windowEntry = this.getBrowserWindowEntry(windowId);
                if (windowEntry) {
                    const devToolsOpened = windowEntry.Window.webContents.isDevToolsOpened();
                    devToolsOpened ? windowEntry.Window.webContents.closeDevTools() : windowEntry.Window.webContents.openDevTools();
                }
                break;
            // Set the id of the webContents of the webview tag which is hosted in the browser window.
            case IPC.RENDERER_READY:
                const _window = BrowserWindow.fromId(windowId);
                const _webViewWebContents = webContents.fromId(params[0] as number);
                if (_window && _webViewWebContents) {
                    /* eslint-disable jsdoc/require-jsdoc */
                    this.windows.push({
                        Window: _window,
                        WebViewWebContents: _webViewWebContents,
                        WebViewWebContentsID: _webViewWebContents.id,
                        RequestHandlers: this.loadRequestHandlers(_webViewWebContents, _window)
                    });
                    /* eslint-enable */
                }
                break;
            // Set new window title of calling renderer process
            case IPC.SET_WINDOW_TITLE:
                if (windowEntry) {
                    this.setWindowTitle(windowEntry.Window, params[0] as string);
                }
                break;
            // Show context menu.
            case IPC.SHOW_CONTEXT_MENU:
                if (windowEntry) {
                    this.onWebViewPopupMenu(windowEntry.WebViewWebContents, params[0] as ContextMenuParams);
                }
                break;
            default:
                event.returnValue = false;
                console.warn(format("Unknown/unhandled IPC message received from renderer: %d %d. ", windowId, msgId, ...params));
                break;
        }
    }

    /**
     * Handles permission requests from web pages. Permissions are granted based on app settings.
     * @param _webContents The calling Electron webContents.
     * @param permission The requested permission.
     * @param callback A callback called with the boolean result of the permission check.
     */
    private onPermissionRequest(_webContents: Electron.WebContents, permission: string, callback: (permissionGranted: boolean) => void): void {
        const grant: boolean = this.settings.Permissions.includes(permission);
        console.info(`Permission '${permission}' requested, ${grant ? "granting." : "denying."}`);
        callback(grant);
    }

    /**
     * Handle a requested resource.
     * @param url The URL requested.
     * @param originalURL The original URL (e. g. given on the command line).
     * @param webContentsId The id of the webContents which requests a resource.
     * @param navType The navigation type (@see RequestHandlers.ts).
     * @returns `true` if the requested resource is allowed to be loaded, otherwise `false`.
     */
    private handleRequest(url: string, originalURL: string, webContentsId: number, navType: NavigationType): boolean {

        /* eslint-disable jsdoc/require-jsdoc */
        const logRequest = (msg: string, onError?: boolean): void => {
            if (onError) {
                console.error(`MainApplication handleRequest: ${msg}\n`);
            } else if (this.settings.LogRequests) {
                console.log(`MainApplication handleRequest: ${msg}`);
            }
        };
        /* eslint-enable */

        logRequest(`${url} (${originalURL})`);
        // Get associated handlers
        let handlers: RequestHandler[] = [];
        for (let i = 0; i < this.windows.length; i++) {
            if (this.windows[i].WebViewWebContentsID === webContentsId) {
                handlers = this.windows[i].RequestHandlers;
                break;
            }
        }
        // Ask all associated handlers to handle the request.
        // eslint-disable-next-line jsdoc/require-jsdoc
        const urlObject = { URL: url };
        for (const handler of handlers) {
            if (!handler.IsActive) {
                continue;
            }
            const currentHandlerName: string = handler.constructor.name;
            const handleResult: RequestResult = handler.handleRequest(urlObject, originalURL, navType);
            const msg = `Result from ${currentHandlerName} (${webContentsId}):`;
            switch (handleResult) {
                case RequestResult.ERROR:
                    logRequest(`${msg} ERROR (denying request and stopping).`, true);
                    return false;
                case RequestResult.NONE:
                    logRequest(`${msg} NONE (not handled, continuing with next handler)`);
                    break;
                case RequestResult.CONTINUE:
                    logRequest(`${msg} CONTINUE (handled, continuing with next handler)`);
                    break;
                case RequestResult.ALLOW:
                    logRequest(`${msg} ALLOW (request allowed, stopping)`);
                    return true;
                case RequestResult.DENY:
                    logRequest(`${msg} DENY (request denied, stopping)`);
                    return false;
            }
        }
        return true;
    }

    /**
     * Fired on every request that tries to load a resource.
     * @param details Request details.
     * @param cb Callback with response if request should be canceled.
     */
    private onBeforeRequest(details: Electron.OnBeforeRequestListenerDetails, cb: (resp: Electron.CallbackResponse) => void) {
        const url: string = details.url;
        let cancelRequest = true;
        try {
            // - Ignore unbound webContents.
            // - Allow all resources of the developer tools.
            // - Allow all resources of BareBrowser itself.
            if (url.startsWith("devtools") || url.startsWith(this.appURLPath) || url.startsWith("chrome")) {
                cancelRequest = false;
                return;
            }
            let webContentsId: number;
            // No WebContents available yet => use topmost window.
            // This happens, for example, on navigating to a new page
            if (details.webContentsId === undefined) {
                const browserWindowEntry = this.getBrowserWindowEntry(undefined);
                if (browserWindowEntry) {
                    webContentsId = browserWindowEntry.WebViewWebContentsID;
                } else {
                    // No WebContents, cancel this request.
                    return;
                }
            } else {
                webContentsId = details.webContentsId;
            }
            cancelRequest = !this.handleRequest(url, url, webContentsId, NavigationType.INTERNAL);
        } finally {
            // eslint-disable-next-line jsdoc/require-jsdoc
            cb({ cancel: cancelRequest });
        }
    }

    /**
     * Register and handle BareBrowsers internal protocol.
     */
    private registerCustomProtocol(): void {
        protocol.handle(this.settings.Scheme, (request): GlobalResponse => {
            /**
             * Create and return a `Response` based on a message (string).
             * @param message The content/message of the response.
             * @param statusCode The status code of the response.
             * @param contentType The content type to be used for the response.
             * @returns A `Response` based on a message {string}.
             */
            const messageResponse = (message: string, statusCode: number, contentType: string): GlobalResponse => {
                return new Response(
                    message,
                    {
                        /* eslint-disable jsdoc/require-jsdoc */
                        status: statusCode,
                        headers: {
                            "content-type": contentType
                        }
                        /* eslint-enable */
                    }
                );
            };

            /**
             * Create and return a `Response` with the content of a file or a 404 response error
             * containing an error message.
             * @param fileName The file name of the resource to load.
             * @param resourceName The original name of the resource.
             * @param contentType The content type to be used for the response.
             * @returns A `Response` with the result of the request.
             */
            const fileContentResponse = (fileName: string, resourceName: string, contentType?: string): GlobalResponse => {
                if (!$FSE.existsSync(fileName)) {
                    return messageResponse(`404 - Resource not found: ${resourceName}\n=> ${fileName}`, 404, "text/plain;charset=utf-8");
                }
                return new Response(
                    $FSE.readFileSync(fileName),
                    {
                        /* eslint-disable jsdoc/require-jsdoc */
                        status: 200,
                        headers: {
                            "content-type": contentType ?? getMimeTypeFromFileExtension($Path.extname(fileName)) ?? MIME_TYPES.BINARY
                        }
                        /* eslint-enable */
                    }
                );
            };

            // Handle URL
            const originalURL = request.url;
            const parsedURL = new $URL.URL(originalURL);
            const host = parsedURL.host.toLowerCase();
            // Requested by, for example, README.html
            if (parsedURL.pathname !== "/") {
                return fileContentResponse($Path.join(APP_INFO.APP_PATH_PKG, parsedURL.pathname.substring(1)), originalURL);
            }
            // Select resource
            const windowEntry = this.getBrowserWindowEntry(this.getCurrentWindow()?.id);
            try {
                let response: Response | undefined = undefined;
                switch (host) {
                    // Known internal URLs
                    case "home":
                        return fileContentResponse(`${APP_INFO.APP_PATH_PKG}home.html`, originalURL, "text/html;charset=utf-8");
                    case "settings":
                        this.setWindowTitle(windowEntry?.Window, `${APP_INFO.ProductName} | Settings`);
                        return messageResponse(JSON.stringify(this.settings, null, 2), 200, "application/json;charset=utf-8");
                    case "info":
                        this.setWindowTitle(windowEntry?.Window, `${APP_INFO.ProductName} | Info`);
                        return messageResponse(JSON.stringify(APP_INFO, null, 2), 200, "application/json;charset=utf-8");
                    case "readme":
                        return fileContentResponse(`${APP_INFO.APP_PATH_PKG}README.html`, originalURL, "text/html;charset=utf-8");
                    case "readme.md":
                        response = fileContentResponse(`${APP_INFO.APP_PATH_PKG}README.md`, originalURL, "text/plain;charset=utf-8");
                        if (response.status === 200) {
                            this.setWindowTitle(windowEntry?.Window, `${APP_INFO.ProductName} | README.md`);
                        }
                        return response;
                    case "license":
                        response = fileContentResponse(`${APP_INFO.APP_PATH_PKG}LICENSE`, originalURL, "text/plain;charset=utf-8");
                        if (response.status === 200) {
                            this.setWindowTitle(windowEntry?.Window, `${APP_INFO.ProductName} | LICENSE`);
                        }
                        return response;
                    case "changes":
                        response = fileContentResponse(`${APP_INFO.APP_PATH_PKG}CHANGES`, originalURL, "text/plain;charset=utf-8");
                        if (response.status === 200) {
                            this.setWindowTitle(windowEntry?.Window, `${APP_INFO.ProductName} | CHANGES`);
                        }
                        return response;
                    case "reload":
                    case "back":
                    case "forward":
                        if (windowEntry) {
                            if (host === "reload") {
                                setImmediate(() => this.handleRequest("<RELOAD>", "<RELOAD>", windowEntry.WebViewWebContentsID, NavigationType.RELOAD));
                            } else if (host === "back") {
                                setImmediate(() => this.handleRequest("<BACK>", "<BACK>", windowEntry.WebViewWebContentsID, NavigationType.BACK));
                            } else if (host === "forward") {
                                setImmediate(() => this.handleRequest("<FORWARD>", "<FORWARD>", windowEntry.WebViewWebContentsID, NavigationType.FORWARD));
                            }
                        }
                        return messageResponse("", 200, "text/plain;charset=utf-8");
                    case "close":
                        if (windowEntry) {
                            setImmediate(() => windowEntry.Window.close());
                        }
                        return messageResponse("", 204, "text/plain;charset=utf-8");
                    // Unknown URL
                    default:
                        this.setWindowTitle(windowEntry?.Window, `${APP_INFO.ProductName} | 404 not found.`);
                        return messageResponse(`404 - Unknown URL: ${parsedURL.toString()}`, 404, "text/plain;charset=utf-8");
                }
            } catch (error) {
                this.setWindowTitle(windowEntry?.Window, `${APP_INFO.ProductName} | Error`);
                return messageResponse(`Error loading resource: ${parsedURL.toString()}\n\n${error}`, 500, "text/plain;charset=utf-8");
            }
        });
    }

    /**
     * This method will be called when Electron has finished initialization and is ready to create
     * browser windows. Some APIs like setting a menu can only be used after this event occurs.
     * @param _launchInfo Specific for mcOS/OS X, see Electron: App.on(event: 'ready',...
     */
    private onAppReady(_launchInfo: AnyObject): void {
        this.postAppReadySetup();
        void this.createWindow();
    }

    /**
     * On activating the app. On darwin it's common to re-create a window in the app when the dock
     * icon is clicked and there are no other windows open. __Note:__ This is left here only for
     * completeness. BareBrowser currently quits if the last browser window is closed.
     * @param _event An Electron event
     * @param _hasVisibleWindows True if there are existing visible windows.
     */
    private onActivate(_event: Electron.Event, _hasVisibleWindows: boolean): void {
        if (this.windows.length === 0) {
            void this.createWindow();
        }
    }

    /**
     * Called when the window is focused. Used to move the calling window to the end of the internal
     * window list.
     * @param window The calling BrowserWindow.
     */
    public onWindowFocus(window: BrowserWindow): void {
        this.setForegoundWindow(window);
    }

    /**
     * Called when the window is going to be closed. Store window bounds and state.
     * @param window The calling BrowserWindow.
     */
    public onWindowClose(window: BrowserWindow): void {
        // No need to store last window position and state.
        if (!this.settings.Window.LastWindowPosition.Restore || this.windows.length !== 1) {
            return;
        }
        this.lastClosedWindowBounds = window.getBounds();
        if (window.isFullScreen()) {
            this.lastClosedWindowState = 2;
        } else if (window.isMaximized()) {
            this.lastClosedWindowState = 1;
        } else if (window.isMinimized()) {
            this.lastClosedWindowState = -1;
        } else {
            this.lastClosedWindowState = 0;
        }
    }

    /**
     * Called when the window was closed. Remove the respective window entry object and dispose its
     * members to avoid leaks.
     * @param window The calling BrowserWindow.
     */
    public onWindowClosed(window: BrowserWindow): void {
        const index: number = this.windows.findIndex(entry => entry.Window === window);
        if (index === -1) {
            return;
        }
        const windowEntry = this.windows[index];
        // @ts-ignore
        windowEntry.Window = null;
        for (let i = 0; i < windowEntry.RequestHandlers.length; i++) {
            windowEntry.RequestHandlers[i].dispose();
            // @ts-ignore
            windowEntry.RequestHandlers[i] = null;
        }
        this.windows.splice(index, 1);
    }

    /**
     * Shows a context menu if the user right clicks somewhere in the renderer window (for example
     * in the address bar).
     * @param webContents The web contents of the browser window (renderer).
     * @param contextMenuParams The context menu params as given by the renderer process.
     */
    public onRendererPopupMenu(webContents: Electron.WebContents, contextMenuParams: ContextMenuParams): void {
        this.onContextMenuPopup(webContents, contextMenuParams);
    }

    /**
     * Shows a context menu if the user right clicks somewhere in the loaded page.
     * @param webContents The web contents of the loaded page.
     * @param contextMenuParams The context menu params as given by the renderer process.
     */
    private onWebViewPopupMenu(webContents: Electron.WebContents, contextMenuParams: ContextMenuParams): void {
        this.onContextMenuPopup(webContents, contextMenuParams);
    }

    /**
     * Shows a context menu.
     * @param webContents The corresponding Electron webContents.
     * @param contextMenuParams The context menu params as given by the renderer process.
     */
    private onContextMenuPopup(webContents: Electron.WebContents, contextMenuParams: ContextMenuParams): void {
        /* eslint-disable jsdoc/require-jsdoc */
        // `role` doesn't work properly in stand alone popup menus so let's steal its native
        // translations and use the usual keyboard shortcuts.
        const editMenu = new Menu();
        const undoMenu = new MenuItem({
            label: new MenuItem({ role: "undo" }).label,
            accelerator: "CmdOrCtrl+Z",
            enabled: contextMenuParams.editFlags.canUndo,
            click: () => { webContents.undo(); },
        });
        editMenu.append(undoMenu);
        const redoMenu = new MenuItem({
            label: new MenuItem({ role: "redo" }).label,
            accelerator: "CmdOrCtrl+Shift+Z",
            enabled: contextMenuParams.editFlags.canRedo,
            click: () => { webContents.redo(); },
        });
        editMenu.append(redoMenu);
        editMenu.append(new MenuItem({ type: "separator" }));
        const cutMenu = new MenuItem({
            label: new MenuItem({ role: "cut" }).label,
            accelerator: "CmdOrCtrl+X",
            enabled: contextMenuParams.editFlags.canCut,
            click: () => { webContents.cut(); },
        });
        editMenu.append(cutMenu);
        const copyMenu = new MenuItem({
            label: new MenuItem({ role: "copy" }).label,
            accelerator: "CmdOrCtrl+C",
            enabled: contextMenuParams.editFlags.canCopy,
            click: () => { webContents.copy(); }
        });
        editMenu.append(copyMenu);
        const copyImageMenu = new MenuItem({
            label: "Copy image",
            accelerator: "CmdOrCtrl+Shift+C",
            enabled: contextMenuParams.hasImageContents,
            click: () => { webContents.copyImageAt(contextMenuParams.x, contextMenuParams.y); }
        });
        editMenu.append(copyImageMenu);
        const pasteMenu = new MenuItem({
            label: new MenuItem({ role: "paste" }).label,
            accelerator: "CmdOrCtrl+V",
            enabled: contextMenuParams.editFlags.canPaste,
            click: () => { webContents.paste(); }
        });
        editMenu.append(pasteMenu);
        editMenu.append(new MenuItem({ type: "separator" }));
        const selectAllMenu = new MenuItem({
            label: new MenuItem({ role: "selectAll" }).label,
            accelerator: "CmdOrCtrl+A",
            enabled: contextMenuParams.editFlags.canSelectAll,
            click: () => { webContents.selectAll(); }
        });
        editMenu.append(selectAllMenu);
        // `popup()` also works with
        // - popup({ window: Electron.BrowserWindow }) *and*
        // - popup({ window: Electron.WebContents })
        // but only with Electron.BrowserWindow is documented.
        editMenu.popup();
        /* eslint-enable */
    }

    /**
     * Emitted before the application starts closing its windows and before the app quits. Used to
     * store the bounds and state of the last active window.
     * @param _event An Electron event.
     */
    private onBeforeQuit(_event: Electron.Event): void {
        // No need to store last window position and state.
        if (!this.settings.Window.LastWindowPosition.Restore) {
            return;
        }
        try {
            // If `this.windows.length === 0` the values for `lastClosedWindowBounds` and
            // `lastClosedWindowState` have been set in `onWindowClose`.
            if (this.windows.length > 0) {
                const window = this.windows[this.windows.length - 1].Window;
                this.lastClosedWindowBounds = window.getBounds();
                if (window.isFullScreen()) {
                    this.lastClosedWindowState = 2;
                } else if (window.isMaximized()) {
                    this.lastClosedWindowState = 1;
                } else if (window.isMinimized()) {
                    this.lastClosedWindowState = -1;
                } else {
                    this.lastClosedWindowState = 0;
                }
            }
            this.settings.Window.LastWindowPosition = {
                /* eslint-disable jsdoc/require-jsdoc */
                Restore: this.settings.Window.LastWindowPosition.Restore,
                Left: this.lastClosedWindowBounds.x,
                Top: this.lastClosedWindowBounds.y,
                Width: this.lastClosedWindowBounds.width,
                Height: this.lastClosedWindowBounds.height,
                State: this.lastClosedWindowState
                /* eslint-enable */
            };
            // eslint-disable-next-line jsdoc/require-jsdoc
            $FSE.writeJSONSync(this.settingsFile, this.settings, { spaces: 4 });
        } catch (error: unknown) {
            console.error(error);
            if (error instanceof Error) {
                dialog.showErrorBox("Error saving settings", error.stack ? `${error.message}\n${error.stack}` : error.message);
            } else {
                dialog.showErrorBox("Error saving settings", JSON.stringify(error));
            }
        }
    }

    /**
     * If ClearTraces is true spawn another instance to enable removing all temporary data. This is
     * currently impossible from within this instance (some files/directories can't be deleted.)
     * @param _event An Electron event.
     * @param _exitCode App exit code.
     */
    private onQuit(_event: Electron.Event, _exitCode: number): void {
        if (!this.settings.ClearTraces) {
            return;
        }
        // app.relaunch({ args: [APP_INFO.APP_PATH, $Consts.CMD_CLEAR_TRACES] })
        // eslint-disable-next-line jsdoc/require-jsdoc
        const childProcess = spawn(process.argv0, [APP_INFO.APP_PATH, $Consts.CMD_CLEAR_TRACES], { detached: true, stdio: "ignore", windowsHide: true });
        childProcess.unref();
    }
}
