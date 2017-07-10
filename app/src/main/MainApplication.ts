import { app, BrowserWindow, ipcMain } from "electron";
import { $FSE, $Path, $URL } from "../shared/Modules";
import * as $Settings from "../shared/Settings";
import * as $URLItem from "../shared/URLItem";
import * as $Consts from "../shared/Consts";

export class CMainApplication {

    private settings: $Settings.Settings;
    private urlItem: $URLItem.URLItem;
    // Keep a global reference of the window object, if you don't, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    private mainWindow: Electron.BrowserWindow | null = null;

    /**
     *
     */
    constructor() {
        this.setApplicationDirectories(); // As early as possible!
        (process.argv.length > 1) ? this.urlItem = $URLItem.getURLItem(process.argv[process.argv.length - 1]) : this.urlItem = $URLItem.getURLItem("");
        this.settings = $Settings.getSettings($Path.join(__dirname, "..", "res", "settings.json"));
        if (!this.settings.HardwareAcceleration) {
            app.disableHardwareAcceleration();
        }
        if (this.settings.SingleInstance) {
            if (app.makeSingleInstance(this.onSingleInstanceCallback.bind(this))) {
                if (process.argv.length === 1) {
                    console.info("Additional instance without params, quitting.");
                } else {
                    console.info("Additional instance, loading %s in current instance and quitting.", process.argv[process.argv.length - 1]);
                }
                app.quit();
                return;
            }
            app.makeSingleInstance(this.onSingleInstanceCallback.bind(this));
        }
        app.on("ready", this.onAppReady.bind(this));
        app.once("quit", this.onQuit.bind(this));
        app.on("activate", this.onActivate.bind(this));
        app.on("window-all-closed", this.onWindowAllClosed.bind(this));
        app.on("open-url", this.onOpenURL.bind(this));
        app.on("open-file", this.onOpenFile.bind(this));
        ipcMain.on("IPC", this.onIPC.bind(this));
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
     * An application name from 'package.json' may be too short to be unambigous and therefore
     * could lead to conflicts in ~/Library/Application Support/ or %APPDATA%, so let's use the
     * value of 'identifier' from the apps package.json instead.
     */
    private setApplicationDirectories(): void {
        let userDataDirectory: string;
        try {
            const pj = require("../package.json");
            if (!pj.identifier) {
                throw(new Error("Member 'identifier' does not exist in 'package.json'"));
            }
            userDataDirectory = pj.identifier;
        } catch (error) {
            // Just fail gracefully and use hard coded default
            console.error("Couldn't retrieve member 'identifier' from 'package.json', using default 'de.idesis.singleinstancebrowser' instead.", error);
            userDataDirectory = "de.idesis.singleinstancebrowser";
        }
        app.setPath("userData", $Path.join(app.getPath("userData"), "..", userDataDirectory));
        const tempDir = $Path.join(app.getPath("userData"), "temp");
        $FSE.mkdirp(tempDir);
        app.setPath("temp", tempDir);
    }

    /**
     *
     */
    private clearTraces(): void {
        if (this.settings.ClearTraces) {
            try {
                $FSE.removeSync(app.getPath("userData"));
            } catch (error) {
                // Will currently fail on win32
            }
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
        this.mainWindow.setContentProtection(true);
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
        const readOptions: $FSE.ReadOptions = {
            throws: true,
        };
        this.mainWindow.setTitle($FSE.readJsonSync($Path.join(__dirname, "..", "package.json"), readOptions).productName);
    }

    /**
     * This method will be called when Electron has finished
     * initialization and is ready to create browser windows.
     * Some APIs can only be used after this event occurs.
     * @param _launchInfo see Electron: App.on(event: 'ready',...
     */
    private onAppReady(_launchInfo: Object): void {
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
