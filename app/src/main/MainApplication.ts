import { BrowserWindow, Menu, app, ipcMain } from "electron";
import * as $Consts from "../shared/Consts";
import { $FSE, $Path, $URL } from "../shared/Modules";
import * as $Settings from "../shared/Settings";
import { URLItem, getURLItem } from "../shared/URLItem";
import { DirectoryListing, getDirectoryListing } from "../shared/Utils";
import { ApplicationMenu } from "./ApplicationMenu";
import { DarwinMenu } from "./DarwinMenu";
import { Win32Menu } from "./Win32Menu";

/**
 * Current Electron TypeScript definitions lack a proper definition for window events.
 * See `onWindowClose` and `onBrowserWindowFocus`.
 */
interface BrowserWindowEvent extends Event {
    sender: Electron.BrowserWindow;
}

/**
 * Current Electron TypeScript definitions lack a proper definition for app events.
 * See `onWindowAllClosed`.
 */
interface AppEvent extends Event {
    sender: Electron.App;
}

/**
 * The class for the main application part. Only one instamce will be created.
 */
export class CMainApplication {

    private appInfo: $Settings.AppInfo;
    private userDataDirectory: string;
    private tempDir: string;
    private settingsFile: string;
    private settings: $Settings.Settings;
    private currentUrlItem: URLItem;
    private appMenu: ApplicationMenu | null = null;
    private windows: Array<Electron.BrowserWindow | null> = [];

    /**
     * Boot and set up Electron app.
     */
    constructor() {
        this.appInfo = this.getAppInfo();
        this.setFileNames(this.appInfo.Identifier);
        this.setAppPaths(); // As early as possible!
        this.settings = this.getSettings(this.settingsFile);
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
        // ... bind a close handler to it ...
        window.on("close", this.onWindowClose.bind(this));
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
     * @returns {AppInfo} An object containg the app name and identifier.
     */
    private getAppInfo(): $Settings.AppInfo {
        const result: $Settings.AppInfo = { Name: "SIB", Identifier: "de.idesis.singleinstancebrowser" };
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
     * @param {string} appIdentifier The app identifier from package.json.
     */
    private setFileNames(appIdentifier: string): void {
        // An application name from 'package.json' may be too short to be unambigous and therefore
        // could lead to conflicts in ~/Library/Application Support/ or %APPDATA%, so let's use the
        // value of 'identifier' from the apps package.json instead.
        this.userDataDirectory = $Path.join(app.getPath("userData"), "..", appIdentifier);
        this.tempDir = $Path.join(this.userDataDirectory, "temp");
        this.settingsFile = $Path.join(this.userDataDirectory, "settings.json");
    }

    /**
     * Create user data and temp directory.
     */
    private setAppPaths(): void {
        // Paths must be available, thus synced.
        //$FSE.mkdirpSync(this.userDataDirectory); // Implicitly created by $FSEmkdirpSync(this.tempDir);
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
     * @param {string} settingsFile The full path of the settings file.
     * @returns {Settings} The loaded app settings.
     */
    private getSettings(settingsFile: string): $Settings.Settings {
        // Get settings from userData directory. At the very first start this won't exist,
        // so get initial default settings from ./res and write it to the userData directory.
        let result: $Settings.Settings;
        if ($FSE.existsSync(settingsFile)) {
            result = $Settings.getSettings(settingsFile);
        } else {
            result = $Settings.getSettings($Path.join(__dirname, "..", "res", "settings.json"));
            $FSE.writeJSONSync(settingsFile, result, {spaces: 4} );
        }
        return result;
    }

    /**
     * Checks wether another instance is already running and if
     * not, registers *this* instance for single instance operation.
     * @returns {boolean} True if the current running instance should quit due to another running instance.
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
        app.on("browser-window-focus", this.onBrowserWindowFocus.bind(this));
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
        const userDataFiles: DirectoryListing = getDirectoryListing(this.userDataDirectory, true);
        // Exclude settings.json file and top directory
        userDataFiles.Directories.splice(userDataFiles.Directories.indexOf(this.userDataDirectory), 1);
        userDataFiles.Files.splice(userDataFiles.Files.indexOf(this.settingsFile), 1);
        const leftOvers: DirectoryListing = { Directories: [], Files: [] };
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
            console.warn(`Clearing traces has the following leftovers: ${leftOvers}`);
        }
    }

    /**
     * Get (last) focused window from the internal window list.
     * @returns {Electron.BrowserWindow | null} The focused window or last focused window or null (should never happen).
     */
    private getCurrentWindow(): Electron.BrowserWindow | null {
        return (this.windows.length > 0) ? this.windows[this.windows.length-1] : null;
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
     * @param {string} fileOrURL The URL (or file) to be loaded.
     * @param {boolean} isFile Indicates whether the given URL is a local file or not.
     */
    private openFileOrURL(fileOrURL: string, isFile: boolean): void {
        this.currentUrlItem = getURLItem(fileOrURL);
        // On Darwin yet determined by onOpen* so set it explicitly here
        this.currentUrlItem.IsFileURL = isFile;
        const currentWindow: Electron.BrowserWindow | null = this.getCurrentWindow();
        if (currentWindow) {
            // Quit command
            if (this.currentUrlItem.URL === $Consts.CMD_QUIT) {
                this.asnycQuit();
                return;
            }
            if (this.settings.FocusOnNewURL) {
                currentWindow.focus();
            }
            currentWindow.webContents.send("IPC", ["loadURLItem", this.currentUrlItem]);
        }
    }

    /**
     * Called by Electron app if another instance was started. This either loads the given URL
     * in the current instance or quits the running instance by the special `http:quit` URL.
     * @param {string[]} args The arguments passed to the instance started elsewhere.
     * @param {string} _workingDirectory The working directory of the instance started elsewhere.
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
     * @param {Electron.Event} event An Electron event
     * @param {string} url The URL to be opened.
     */
    private onOpenURL(event: Electron.Event, url: string): void {
        event.preventDefault();
        this.openFileOrURL(url, false);
    }

    /**
     * Called on Darwin when the app is started with 'open' and specifying a file.
     * @param {Electron.Event} event An Electron event
     * @param {string} fileName The file to be loaded.
     */
    private onOpenFile(event: Electron.Event, fileName: string): void {
        event.preventDefault();
        this.openFileOrURL(fileName, true);
    }

    /**
     * Handles all IPC calls from renderer processes.
     * @param {Electron.Event} event The Electron event. Used to return values/objects back to the calling renderer process.
     * @param {any[]} args The arguments sent by the calling renderer process.
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
                    Menu.getApplicationMenu() ? Menu.setApplicationMenu(null as any) : Menu.setApplicationMenu(this.appMenu.Menu);
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
     * @param {Object} _launchInfo see Electron: App.on(event: 'ready',...
     */
    private onAppReady(_launchInfo: Object): void {
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
     * @param {Electron.Event} _event An Electron event
     * @param {boolean} _hasVisibleWindows True if there are existing visible windows.
     */
    private onActivate(_event: Electron.Event, _hasVisibleWindows: boolean): void {
        if (this.windows.length === 0) {
            this.createWindow();
        }
    }

    /**
     * Called when the window is focused.
     * Used to move the calling window to the end of the internal window list.
     * @param {BrowserWindowEvent} event The event containing the calling BrowserWindow (`sender`).
     */
    private onBrowserWindowFocus(event: BrowserWindowEvent): void {
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
     * @param {BrowserWindowEvent} event The event containing the calling BrowserWindow (`sender`).
     */
    private onWindowClose(event: BrowserWindowEvent): void {
        const index: number = this.windows.indexOf(event.sender);
        if (index !== -1) {
            const window: Array<Electron.BrowserWindow | null> = this.windows.splice(index, 1);
            window[0] = null;
        }
    }

    /**
     * Called when all windows are closed => quit app.
     * @param {AppEvent} event The event containing the App (`sender`).
     */
    private onWindowAllClosed(_event: AppEvent): void {
        app.quit();
    }

    /**
     * Try to remove all temporary data on quitting the app.
     * @param {Electron.Event} _event An Electron event.
     * @param {number} _exitCode App exit code.
     */
    private onQuit(_event: Electron.Event, _exitCode: number): void {
        if (this.settings.ClearTraces) {
            this.clearTraces();
        }
    }
}
