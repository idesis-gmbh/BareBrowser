import { app, BrowserWindow, ipcMain, Menu } from "electron";
import * as $Consts from "../shared/Consts";
import { $FSE, $Path, $URL } from "../shared/Modules";
import * as $Settings from "../shared/Settings";
import { getURLItem, IURLItem } from "../shared/URLItem";
import { getDirectoryListing, IDirectoryListing } from "../shared/Utils";
import { ApplicationMenu } from "./ApplicationMenu";
import { DarwinMenu } from "./DarwinMenu";
import { Win32Menu } from "./Win32Menu";

/**
 * Current Electron TypeScript definitions lack a proper definition for on close window events.
 *  @see onWindowClose and onWindowFocus
 */
// @ts-ignore
interface IBrowserWindowCloseEvent extends Electron.Event {
    sender: Electron.BrowserWindow;
}

/**
 * The class for the main application part. Only one instamce will be created.
 */
export class CMainApplication {

    private appInfo: $Settings.IAppInfo;
    private userDataDirectory: string;
    private tempDir: string;
    private settingsFile: string;
    private settingsTemplateFile: string;
    private settings: $Settings.ISettings;
    private currentUrlItem: IURLItem;
    private appMenu: ApplicationMenu | null = null;
    private windows: Array<Electron.BrowserWindow | null> = [];

    /**
     * Boot and set up Electron app.
     */
    constructor() {
        this.appInfo = this.getAppInfo();
        this.setFileNames(this.appInfo.Identifier);
        this.setAppPaths(); // As early as possible!
        this.settings = this.getSettings();
        if (this.shouldQuitForSingleInstance()) {
            app.quit();
            return;
        }
        this.setUp();
        this.bindEvents();
    }

    /**
     * Quit (Electron) application, beforehand close all open windows.
     */
    public quit(): void {
        this.closeAllWindows();
        app.quit();
    }

    /**
     * Create a browser window.
     */
    public createWindow(): void {
        const bwOptions: Electron.BrowserWindowConstructorOptions = {
            width: this.settings.Window.Width,
            height: this.settings.Window.Height,
        };
        // Place new window with offset to latest current window
        const currentWindow: Electron.BrowserWindow | null = this.getCurrentWindow();
        if (currentWindow) {
            bwOptions.x = currentWindow.getBounds().x + 50;
            bwOptions.y = currentWindow.getBounds().y + 50;
        } else {
            bwOptions.x = this.settings.Window.Left;
            bwOptions.y = this.settings.Window.Top;
        }
        // Create the browser window ...
        const window: Electron.BrowserWindow = new BrowserWindow(bwOptions);
        window.setContentProtection(this.settings.ContentProtection);
        // ... bind close and focus handlers to it ...
        window.on("close", this.onWindowClose.bind(this));
        window.on("focus", this.onWindowFocus.bind(this));
        // ... and load index.html.
        const urlObject: $URL.UrlObject = {
            pathname: $Path.join(__dirname, "..", "index.html"),
            protocol: "file:",
            slashes: true,
        };
        window.loadURL($URL.format(urlObject));
        // Set title to product name from ../package.json
        window.setTitle(this.appInfo.Name);
        // Register window
        this.windows.push(window);
    }

    /**
     * Quitting by command line has to be done asynchronously,
     * otherwise an `UnhandledPromiseRejectionWarning` will occur.
     */
    private asnycQuit(): void {
        setTimeout(() => {
            this.closeAllWindows();
        },         200);
    }

    /**
     * Retrieve app name and identifier in a single operation; both are needed later.
     * @returns An object containg the app name and identifier.
     */
    private getAppInfo(): $Settings.IAppInfo {
        const result: $Settings.IAppInfo = { Name: "SIB", Identifier: "de.idesis.singleinstancebrowser" };
        try {
            const pj = require("../package.json");
            if (!pj.productName) {
                console.warn("Member 'productName' does not exist in 'package.json'");
            } else {
                result.Name = pj.productName;
            }
            if (!pj.identifier) {
                console.warn("Member 'identifier' does not exist in 'package.json'");
            } else {
                result.Identifier = pj.identifier;
            }
        } catch (error) {
            console.error("Couldn't read 'package.json', using defaults 'SIB' and de.idesis.singleinstancebrowser' for AppInfo instead.", error);
        }
        return result;
    }

    /**
     * Make strings for user data and temp directory.
     * @param appIdentifier The app identifier from package.json.
     */
    private setFileNames(appIdentifier: string): void {
        // An application name from 'package.json' may be too short to be unambigous and therefore
        // could lead to conflicts in ~/Library/Application Support/ or %APPDATA%, so let's use the
        // value of 'identifier' from the apps package.json instead.
        this.userDataDirectory = $Path.join(app.getPath("userData"), "..", appIdentifier);
        this.tempDir = $Path.join(this.userDataDirectory, "temp");
        this.settingsFile = $Path.join(this.userDataDirectory, "settings.json");
        // Here we need the physical file, not just the fake link inside the ASAR file!
        this.settingsTemplateFile = $Path.join(__dirname, "..", "..", "app.asar.unpacked", "res", "settings.json");
    }

    /**
     * Create user data and temp directory.
     */
    private setAppPaths(): void {
        // Paths must be available, thus synced.
        // $FSE.mkdirpSync(this.userDataDirectory); // Implicitly created by $FSEmkdirpSync(this.tempDir);
        $FSE.mkdirpSync(this.tempDir);
        app.setPath("userData", this.userDataDirectory);
        app.setPath("temp", this.tempDir);
    }

    /**
     * Create and install a basic menu depending on the current platform.
     */
    private setApplicationMenu(): void {
        if (process.platform === "darwin") {
            this.appMenu = new DarwinMenu(this.appInfo.Name);
            Menu.setApplicationMenu(this.appMenu.Menu);
        } else if (process.platform === "win32") {
            switch (this.settings.Win32MenuState) {
                // No menu for Win32 allowed
                case 0:
                    break;

                // Menu for Win32 allowed but initially hidden
                case 1:
                    this.appMenu = new Win32Menu(this.appInfo.Name);
                    break;

                // Allow and show menu for Win32
                case 2:
                    this.appMenu = new Win32Menu(this.appInfo.Name);
                    Menu.setApplicationMenu(this.appMenu.Menu);
                    break;
            }
        }
    }

    /**
     * Load app settings.
     * @returns The loaded app settings.
     */
    private getSettings(): $Settings.ISettings {
        let result: $Settings.ISettings = $Settings.getDefaultSettings();
        let hasUserSettings: boolean = false;
        try {
            // First, update existing user settings from the template or create
            // them, if they don't exist. Only possible, if a template exists.
            if ($FSE.existsSync(this.settingsTemplateFile)) {
                // There are no user settings, create them from the template
                if (!$FSE.existsSync(this.settingsFile)) {
                    $FSE.copyFileSync(this.settingsTemplateFile, this.settingsFile);
                // If the template is newer than the user settings overwrite them with the template
                } else if ($FSE.statSync(this.settingsTemplateFile).mtime > $FSE.statSync(this.settingsFile).mtime) {
                    // Make backup
                    const backupFilename: string = $Path.join(
                        this.userDataDirectory,
                        "settings-"
                        + new Date().toISOString().replace("T", "_").replace(/:/g, "-").replace(/.[0-9]{3}Z/g, "")
                        +  ".json");
                    $FSE.copyFileSync(this.settingsFile, backupFilename);
                    // New settings from template
                    $FSE.copyFileSync(this.settingsTemplateFile, this.settingsFile);
                }
                hasUserSettings = true;
            }
            if (hasUserSettings || $FSE.existsSync(this.settingsFile)) {
                result = $Settings.getSettings(this.settingsFile);
            } else {
                $FSE.writeJSONSync(this.settingsFile, result, {spaces: 4});
            }
        } catch (error) {
            console.error("Could't update and/or read user settings.", error);
        }
        return result;
    }

    /**
     * Checks wether another instance is already running and if
     * not, registers *this* instance for single instance operation.
     * @returns True if the current running instance should quit due to another running instance.
     */
    private shouldQuitForSingleInstance(): boolean {
        if (this.settings.SingleInstance) {
            // makeSingleInstance returns false if this is the first instance
            if (app.makeSingleInstance(this.onSingleInstanceCallback.bind(this))) {
                if (process.argv.length === 1) {
                    console.info("Additional instance without params, quitting.");
                } else {
                    console.info("Additional instance, loading %s in current instance and quitting.", process.argv[process.argv.length - 1]);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Apply some settings. Most other settings have to be applied earlier.
     * Also sets the initial URL to be loaded (if any).  Can probably used
     * in the future for more settings.
     */
    private setUp(): void {
        if (!this.settings.HardwareAcceleration) {
            app.disableHardwareAcceleration();
        }
        // Initial URL to be opened
        // tslint:disable-next-line:prefer-conditional-expression
        if (process.argv.length > 1) {
            this.currentUrlItem = getURLItem(process.argv[process.argv.length - 1]);
         } else {
             this.currentUrlItem = getURLItem("");
         }
    }

    /**
     * Bind event handlers.
     */
    private bindEvents(): void {
        // App events
        app.on("ready", this.onAppReady.bind(this));
        app.once("quit", this.onQuit.bind(this));
        app.on("activate", this.onActivate.bind(this));
        app.on("open-url", this.onOpenURL.bind(this));
        app.on("open-file", this.onOpenFile.bind(this));
        app.on("web-contents-created", this.onWebContentsCreated.bind(this));
        app.on("window-all-closed", this.onWindowAllClosed.bind(this));
        ipcMain.on("IPC", this.onIPC.bind(this));
    }

    /**
     * Depending on the settings remove all temporary data like caches, cookies etc.
     * but keep the settings file.
     * So far this isn't 100% percent reliable on Darwin platforms. For example, if
     * you close the inital window too fast a file named `Preferences` can be written
     * to the user data directory even *after* the last window has been closed.
     * Although this file contains no private data, this is undesireable.
     * The same is true for the directory `Service Worker`, it won't be deleted.
     * On Windows it's even worse, most of the files and directories remain. This
     * seems to be a bug in either the Node.js runtime or the Chromium engine which
     * don't free file handles correctly (just guessing).
     */
    private clearTraces(): void {
        const userDataFiles: IDirectoryListing = getDirectoryListing(this.userDataDirectory, true);
        // Exclude top directory
        userDataFiles.Directories.splice(userDataFiles.Directories.indexOf(this.userDataDirectory), 1);
        // Exclude settings.json and backups of it
        // tslint:disable-next-line:max-line-length
        const regExp = new RegExp("([\\/|\\\\]{1}settings-[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}-[0-9]{2}\\.json)$");
        userDataFiles.Files = userDataFiles.Files.filter((fileName: string): boolean => {
            return !(fileName === this.settingsFile || regExp.test(fileName));
        });
        const leftOvers: IDirectoryListing = { Directories: [], Files: [] };
        // First remove files...
        for (const entry of userDataFiles.Files) {
            try {
                $FSE.removeSync(entry);
            } catch (error) {
                leftOvers.Files.push(entry);
            }
        }
        // ... then directories
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
     * Get (last) focused window from the internal window list.
     * @returns The focused window or last focused window or null (should never happen).
     */
    private getCurrentWindow(): Electron.BrowserWindow | null {
        return (this.windows.length > 0) ? this.windows[this.windows.length - 1] : null;
    }

    /**
     * Close all existing browser windows (also stopping any content loading).
     */
    private closeAllWindows(): void {
        for (const window of this.windows) {
            if (window) {
                window.webContents.stop();
                window.close();
            }
        }
    }

    /**
     * Called by the two `onOpen` events. Gets the current window and loads the given URL in it.
     * @param fileOrURL The URL (or file) to be loaded.
     * @param isFile Indicates whether the given URL is a local file or not.
     */
    private openFileOrURL(fileOrURL: string, isFile: boolean, browserWindow?: BrowserWindow): void {
        this.currentUrlItem = getURLItem(fileOrURL);
        // On Darwin yet determined by onOpen* so set it explicitly here
        this.currentUrlItem.IsFileURL = isFile;
        const targetWindow: Electron.BrowserWindow | null = browserWindow ? browserWindow : this.getCurrentWindow();
        if (targetWindow) {
            // Quit command
            if (this.currentUrlItem.URL === $Consts.CMD_QUIT) {
                this.asnycQuit();
                return;
            }
            if (this.settings.FocusOnNewURL) {
                targetWindow.focus();
            }
            targetWindow.webContents.send("IPC", ["loadURLItem", this.currentUrlItem]);
        }
    }

    /**
     * Called by Electron app if another instance was started. This either loads the given URL
     * in the current instance or quits the running instance by the special `http:quit` URL.
     * @param args The arguments passed to the instance started elsewhere.
     * @param _workingDirectory The working directory of the instance started elsewhere.
     */
    private onSingleInstanceCallback(args: string[], _workingDirectory: string): void {
        this.currentUrlItem = getURLItem(args[args.length - 1]);
        // Quit command received
        if (this.currentUrlItem.URL === $Consts.CMD_QUIT) {
            this.asnycQuit();
            return;
        }
        // Open the given URL in current window
        const currentWindow: Electron.BrowserWindow | null = this.getCurrentWindow();
        if (currentWindow) {
            if (this.settings.FocusOnNewURL) {
                currentWindow.focus();
            }
            if (args.length > 1) {
                currentWindow.webContents.send("IPC", ["loadURLItem", this.currentUrlItem]);
            }
        }
    }

    /**
     * Called on Darwin when the app is started with 'open' and specifying a URL.
     * @param event An Electron event
     * @param url The URL to be opened.
     */
    private onOpenURL(event: Electron.Event, url: string): void {
        event.preventDefault();
        this.openFileOrURL(url, false);
    }

    /**
     * Called on Darwin when the app is started with 'open' and specifying a file.
     * @param event An Electron event
     * @param fileName The file to be loaded.
     */
    private onOpenFile(event: Electron.Event, fileName: string): void {
        event.preventDefault();
        this.openFileOrURL(fileName, true);
    }

    /**
     * The event `will-navigate` cannot be prevented in the renderer process so it has to
     * be done here in the main process.
     * @param _event An Electron event.
     * @param webContents The web contents which will be created.
     * @see https://github.com/electron/electron/issues/1378#issuecomment-265207386
     */
    private onWebContentsCreated(_event: Electron.Event, webContents: Electron.WebContents): void {
        webContents.on("will-navigate", (willNavigateEvent: Electron.Event, url: string) => {
            willNavigateEvent.preventDefault();
            this.openFileOrURL(url, url.startsWith("file://"), BrowserWindow.fromWebContents(willNavigateEvent.sender));
        });
    }

    /**
     * Handles all IPC calls from renderer processes.
     * @param event The Electron event. Used to return values/objects back to the calling renderer process.
     * @param args The arguments sent by the calling renderer process.
     */
    // tslint:disable-next-line:no-any
    private onIPC(event: Electron.Event, ...args: any[]): void {
        switch (args[0][0]) {
            // Return the current (last) URLItem
            case "queryURLItem":
                event.returnValue = this.currentUrlItem;
                break;

            // Return app settings
            case "getSettings":
                event.returnValue = this.settings;
                break;

            // Return app info
            case "getAppInfo":
                event.returnValue = this.appInfo;
                break;

            // Toggle main menu on Win32 platforms
            case "toggleWin32Menu":
                if ((process.platform === "win32") && (this.settings.Win32MenuState > 0) && (this.appMenu)) {
                    // tslint:disable-next-line:no-any
                    Menu.getApplicationMenu() ?
                        Menu.setApplicationMenu(null as any) : Menu.setApplicationMenu(this.appMenu.Menu);
                    event.returnValue = true;
                } else {
                    event.returnValue = false;
                }
                break;

            // Create and open a new window. The calling renderer process will
            // request the (new) URLItem to be opened with another IPC call.
            case "openWindow":
                const url: string = args[0][1];
                if (url) {
                    event.returnValue = true;
                    this.currentUrlItem = getURLItem(url);
                    this.createWindow();
                } else {
                    event.returnValue = false;
                }
                break;

            default:
                event.returnValue = false;
                break;
        }
    }

    /**
     * This method will be called when Electron has finished initialization and
     * is ready to create browser windows. Some APIs like setting a menu can only
     * be used after this event occurs.
     * @param _launchInfo see Electron: App.on(event: 'ready',...
     */
    private onAppReady(_launchInfo: {}): void {
        this.setApplicationMenu();
        this.createWindow();
    }

    /**
     * On activating the app.
     * On darwin it's common to re-create a window in the app when the
     * dock icon is clicked and there are no other windows open.
     * *Note:* This is left here only for completeness.
     * SingleInstanceBrowser currently quits if the last browser window is closed
     * (see `onWindowAllClosed`) so this event never gets called.
     * @param _event An Electron event
     * @param _hasVisibleWindows True if there are existing visible windows.
     */
    private onActivate(_event: Electron.Event, _hasVisibleWindows: boolean): void {
        if (this.windows.length === 0) {
            this.createWindow();
        }
    }

    /**
     * Called when the window is focused.
     * Used to move the calling window to the end of the internal window list.
     * @param event The event containing the calling BrowserWindow (`sender`).
     * @param window The browser window which got focused.
     */
    private onWindowFocus(event: IBrowserWindowCloseEvent): void {
        const index: number = this.windows.indexOf(event.sender);
        if (index !== -1) {
            this.windows.push(this.windows.splice(index, 1)[0]);
        }
    }

    /**
     * Called when the window is going to be closed.
     * Remove the respective window object from the internal array and set it to
     * null to avoid leaks. Since preventDefault is never used it's ok to do the
     * removal already here (before the window actually is `closed`)
     * @param event The event containing the calling BrowserWindow (`sender`).
     * @see IBrowserWindowCloseEvent;
     */
    private onWindowClose(event: IBrowserWindowCloseEvent): void {
        const index: number = this.windows.indexOf(event.sender);
        if (index !== -1) {
            const window: Array<Electron.BrowserWindow | null> = this.windows.splice(index, 1);
            window[0] = null;
        }
    }

    /**
     * Called when all windows are closed => quit app.
     * @param event The event containing the App (`sender`).
     */
    private onWindowAllClosed(): void {
        app.quit();
    }

    /**
     * Try to remove all temporary data on quitting the app.
     * @param _event An Electron event.
     * @param _exitCode App exit code.
     */
    private onQuit(_event: Electron.Event, _exitCode: number): void {
        if (this.settings.ClearTraces) {
            this.clearTraces();
        }
    }
}
