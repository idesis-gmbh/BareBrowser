import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { $FSE, $Path, $URL } from "../shared/Modules";
import * as $Settings from "../shared/Settings";
import * as $URLItem from "../shared/URLItem";
import * as $Utils from "../shared/Utils";
import * as $Consts from "../shared/Consts";
import { ApplicationMenu } from "./ApplicationMenu";
import { DarwinMenu } from "./DarwinMenu";
import { Win32Menu } from "./Win32Menu";

interface AppInfo {
    Name: string;
    Identifier: string;
}

export class CMainApplication {

    private appInfo: AppInfo;
    private userDataDirectory: string;
    private tempDir: string;
    private settingsFile: string;
    private settings: $Settings.Settings;
    private urlItem: $URLItem.URLItem;
    private appMenu: ApplicationMenu | null = null;
    //private windows: Electron.BrowserWindow[];
    private mainWindow: Electron.BrowserWindow | null = null;

    /**
     *
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
     * Quit (Electron) application.
     */
    public quit(): void {
        if (this.mainWindow) {
            this.mainWindow.close();
        }
        app.quit();
    }

    /**
     *
     * @returns
     */
    private getAppInfo(): AppInfo {
        const result: AppInfo = { Name: "SIB", Identifier: "de.idesis.singleinstancebrowser" };
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
     *
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
     *
     */
    private setAppPaths(): void {
        // Must be available, thus synced
        //$FSE.mkdirpSync(this.userDataDirectory); // Implicitly created by $FSEmkdirpSync(this.tempDir);
        $FSE.mkdirpSync(this.tempDir);
        app.setPath("userData", this.userDataDirectory);
        app.setPath("temp", this.tempDir);
    }

    /**
     *
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
     *
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
     *
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
     *
     */
    private setUp() {
        if (!this.settings.HardwareAcceleration) {
            app.disableHardwareAcceleration();
        }
        // Initial URL to be opened
        (process.argv.length > 1) ? this.urlItem = $URLItem.getURLItem(process.argv[process.argv.length - 1]) : this.urlItem = $URLItem.getURLItem("");
    }

    /**
     *
     */
    private bindEvents(): void {
        // App events
        app.on("ready", this.onAppReady.bind(this));
        app.once("quit", this.onQuit.bind(this));
        app.on("activate", this.onActivate.bind(this));
        app.on("window-all-closed", this.onWindowAllClosed.bind(this));
        app.on("open-url", this.onOpenURL.bind(this));
        app.on("open-file", this.onOpenFile.bind(this));
        ipcMain.on("IPC", this.onIPC.bind(this));
    }

    /**
     *
     */
    private clearTraces(): void {
        const userDataFiles: $Utils.DirectoryListing = $Utils.getDirectoryListing(this.userDataDirectory, true);
        // Exclude settings.json file and top directory
        userDataFiles.Directories.splice(userDataFiles.Directories.indexOf(this.userDataDirectory), 1);
        userDataFiles.Files.splice(userDataFiles.Files.indexOf(this.settingsFile), 1);
        const leftOvers: $Utils.DirectoryListing = { Directories: [], Files: [] };
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
     *
     * @param args
     * @param _workingDirectory
     */
    private onSingleInstanceCallback(args: string[], _workingDirectory: string): void {
        if (this.mainWindow) {
            this.urlItem = $URLItem.getURLItem(args[args.length - 1]);
            // Quit command
            if (this.urlItem.URL === $Consts.CMD_QUIT) {
                this.asnycQuit();
                return;
            } else if (this.settings.FocusOnNewURL) {
                this.mainWindow.focus();
            }
            if (args.length > 1) {
                this.mainWindow.webContents.send("IPC", ["loadURLItem", this.urlItem]);
            }
        }
    }

    /**
     * Called on darwin when the app is started with 'open' and specifying a URL.
     * @param event
     * @param url
     */
    private onOpenURL(event: Electron.Event, url: string): void {
        event.preventDefault();
        this.openFileOrURL(url, false);
    }

    /**
     * Called on darwin when the app is started with 'open' and specifying a file.
     * @param event
     * @param file
     */
    private onOpenFile(event: Electron.Event, file: string): void {
        event.preventDefault();
        this.openFileOrURL(file, true);
    }

    /**
     *
     * @param event
     * @param args
     */
    // tslint:disable-next-line:no-any
    private onIPC(event: Electron.Event, ...args: any[]): void {
        switch (args[0][0]) {
            case "queryURLItem":
                event.returnValue = this.urlItem;
                break;

            case "getSettings":
                event.returnValue = this.settings;
                break;

            case "toggleWin32Menu":
                if ((process.platform === "win32") && (this.settings.Win32MenuState > 0) && (this.appMenu)) {
                    // tslint:disable-next-line:no-any
                    Menu.getApplicationMenu() ? Menu.setApplicationMenu(null as any) : Menu.setApplicationMenu(this.appMenu.Menu);
                    event.returnValue = true;
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
     *
     * @param fileOrURL
     * @param isFile
     */
    private openFileOrURL(fileOrURL: string, isFile: boolean): void {
        this.urlItem = $URLItem.getURLItem(fileOrURL);
        // On Darwin yet determined by onOpen* so set it explicitly here
        this.urlItem.IsFileURL = isFile;
        if (this.mainWindow) {
            // Quit command
            if (this.urlItem.URL === $Consts.CMD_QUIT) {
                this.asnycQuit();
                return;
            }
            if (this.settings.FocusOnNewURL) {
                this.mainWindow.focus();
            }
            this.mainWindow.webContents.send("IPC", ["loadURLItem", this.urlItem]);
        }
    }

    /**
     * Quitting by command line has to be done asynchronously,
     * otherwise an UnhandledPromiseRejectionWarning will occur.
     */
    private asnycQuit(): void {
        setTimeout(() => {
            if (this.mainWindow) {
                this.mainWindow.webContents.stop();
                this.mainWindow.close();
            }
        },         200);
    }

    /**
     * Create a browser window.
     */
    private createWindow(): void {
        if (this.mainWindow) {
            return;
        }
        const bwOptions: Electron.BrowserWindowConstructorOptions = {
            x: this.settings.Window.Left,
            y: this.settings.Window.Top,
            width: this.settings.Window.Width,
            height: this.settings.Window.Height,
        };
        // Create the browser window ...
        this.mainWindow = new BrowserWindow(bwOptions);
        this.mainWindow.setContentProtection(this.settings.ContentProtection);
        // ... bind a close handler to it ...
        this.mainWindow.on("closed", this.onWindowClosed.bind(this));
        // ... and load the index.html of the app.
        const urlObject: $URL.UrlObject = {
            pathname: $Path.join(__dirname, "..", "index.html"),
            protocol: "file:",
            slashes: true,
        };
        this.mainWindow.loadURL($URL.format(urlObject));
        // Set title to product name from ../package.json
        this.mainWindow.setTitle(this.appInfo.Name);
    }

    /**
     * This method will be called when Electron has finished
     * initialization and is ready to create browser windows.
     * Some APIs can only be used after this event occurs.
     * @param _launchInfo see Electron: App.on(event: 'ready',...
     */
    private onAppReady(_launchInfo: Object): void {
        this.setApplicationMenu();
        this.createWindow();
    }

    /**
     * On activating the app.
     * On darwin it's common to re-create a window in the app when the
     * dock icon is clicked and there are no other windows open.
     * @param _event
     * @param _hasVisibleWindows
     */
    private onActivate(_event: Electron.Event, _hasVisibleWindows: boolean): void {
        if (this.mainWindow === null) {
            this.createWindow();
        }
    }

    /**
     * Emitted when the window is closed.
     * Dereference the window object, usually you would store windows
     * in an array if your app supports multi windows, this is the time
     * when you should delete the corresponding element.
     */
    private onWindowClosed(): void {
        this.mainWindow = null;
    }

    /**
     * Quit when all windows are closed.
     */
    private onWindowAllClosed(): void {
        app.quit();
    }

    /**
     *
     * @param _event
     * @param _exitCode
     */
    private onQuit(_event: Electron.Event, _exitCode: number): void {
        this.clearTraces();
    }
}
