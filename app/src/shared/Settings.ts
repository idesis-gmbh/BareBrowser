import { $FSE } from "./Modules";
import * as $Utils from "./Utils";

/**
 * Holds app name and identifier.
 * Maybe extended for future attributes.
 */
export interface IAppInfo {
    /**
     * Name of this app.
     */
    Name: string;
    /**
     * Identifier of this app.
     */
    Identifier: string;
}

/**
 * Interface for app settings.
 */
export interface ISettings {
    /**
     * Properties of a browser window.
     * Currently only the offset and the size are stored.
     */
    Window: {
        /**
         * Left offset of window.
         */
        Left: number;
        /**
         * Top offset of window.
         */
        Top: number;
        /**
         * Width of window
         */
        Width: number;
        /**
         * Height of window
         */
        Height: number;
    };
    /**
     * Holds the keyboard shortcuts for various actions.
     */
    ShortCuts: {
        /**
         * Enable/disable shortcuts, if the URL entry field is focused.
         */
        Global: boolean,
        /**
         * Show/hide address bar.
         */
        ToggleAddressBar: string[],
        /**
         * Show/hide developer tools for the browser window.
         */
        ToggleInternalDevTools: string[],
        /**
         * Show/hide developer tools for the currently loaded URL.
         */
        ToggleDevTools: string[],
        /**
         * Show addressbar and focus the URL entry field.
         */
        FocusLocationBar: string[],
        /**
         * Reload the browser window.
         */
        InternalReload: string[],
        /**
         * Reload the current page.
         */
        Reload: string[],
        /**
         * Go back in browser history.
         */
        GoBack: string[],
        /**
         * Go forward in browser history.
         */
        GoForward: string[],
        /**
         * Leave fullscreen view.
         */
        ExitHTMLFullscreen: string[];
        /**
         * Show/hide the menu on windows platforms.
         */
        ToggleWin32Menu: string[];
    };
    /**
     * All known URL handler classes.
     */
    URLHandlers: Array<{
        /**
         * URL handler class name (must be unique).
         */
        ClassName: string;
        /**
         * JavaScrpt filename of URL handler.
         */
        Source: string;
        /**
         * Configuration of URL handler.
         */
        Config?: {};
    }>;
    /**
     * The user agent string used by the browser.
     */
    UserAgent: string;
    /**
     * Permissions for the loaded page.
     */
    Permissions: string[];
    /**
     * Allow plugins to be loaded.
     */
    AllowPlugins: boolean;
    /**
     * Allow loaded pages to open popups.
     */
    AllowPopups: boolean;
    /**
     * Allow loaded pages to open new windows.
     */
    AllowNewWindows: boolean;
    /**
     * Delete all files in the user data directory after quitting the app.
     */
    ClearTraces: boolean;
    /**
     * Support single instance mode.
     */
    SingleInstance: boolean;
    /**
     * Activate the last open browser window if a new URL was requested via the command line.
     */
    FocusOnNewURL: boolean;
    /**
     * Enable hardware acceleration.
     */
    HardwareAcceleration: boolean;
    /**
     * Enable content protection for browser windows.
     */
    ContentProtection: boolean;
    /**
     * Initial state of menu on windows platforms.
     */
    Win32MenuState: number;
    /**
     * Open the given page on startup.
     */
    Homepage: string;
}

/**
 * Get settings object with default values.
 * @returns A Settings object.
 */
export function getDefaultSettings(): ISettings {
    return {
        Window: {
            Left: 50,
            Top: 50,
            Width: 1024,
            Height: 768,
        },
        ShortCuts: {
            Global: true,
            ToggleAddressBar: ["mod+t"],
            ToggleInternalDevTools: ["mod+shift+d"],
            ToggleDevTools: ["mod+d"],
            FocusLocationBar: ["mod+l"],
            InternalReload: ["mod+shift+r", "shift+f5"],
            Reload: ["mod+r", "f5"],
            GoBack: ["ctrl+alt+left"],
            GoForward: ["ctrl+alt+right"],
            ExitHTMLFullscreen: ["esc"],
            ToggleWin32Menu: ["ctrl+h"],
        },
        URLHandlers: [
            {
                ClassName: "DefaultURLHandler",
                Source: "./lib/DefaultURLHandler.js",
            },
        ],
        UserAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
        Permissions: ["fullscreen"],
        AllowPlugins: false,
        AllowPopups: false,
        AllowNewWindows: true,
        ClearTraces: false,
        SingleInstance: true,
        FocusOnNewURL: true,
        HardwareAcceleration: true,
        ContentProtection: false,
        Win32MenuState: 1,
        Homepage: "",
    };
}

/**
 * Get current app settings object.
 * If reading from file fails, default settings are returned.
 * @param configFile Full path of the settings file.
 * @returns The current app settings obtained from `configFile` or default settings.
 */
export function getSettings(configFile: string): ISettings {
    let settings: ISettings;
    try {
        settings = $FSE.readJsonSync(configFile);
    } catch (error) {
        console.error("Could't read configuration file", configFile, error);
        return getDefaultSettings();
    }
    let userAgent: string;
    // tslint:disable-next-line:prefer-conditional-expression
    if (typeof settings.UserAgent !== "string") {
        userAgent = (typeof navigator === "undefined" ? "" : navigator.userAgent);
    } else {
        userAgent = settings.UserAgent;
    }
    settings = {
        Window: {
            Left: $Utils.normalize(settings.Window.Left, 50),
            Top: $Utils.normalize(settings.Window.Top, 50),
            Width: $Utils.normalize(settings.Window.Width, 1024),
            Height: $Utils.normalize(settings.Window.Height, 768),
        },
        ShortCuts: {
            Global: $Utils.normalize(settings.ShortCuts.Global, true),
            ToggleAddressBar: $Utils.normalize(settings.ShortCuts.ToggleAddressBar, ["mod+t"]),
            ToggleInternalDevTools: $Utils.normalize(settings.ShortCuts.ToggleInternalDevTools, ["mod+shift+d"]),
            ToggleDevTools: $Utils.normalize(settings.ShortCuts.ToggleDevTools, ["mod+d"]),
            FocusLocationBar: $Utils.normalize(settings.ShortCuts.FocusLocationBar, ["mod+l"]),
            InternalReload: $Utils.normalize(settings.ShortCuts.InternalReload, ["mod+shift+r", "shift+f5"]),
            Reload: $Utils.normalize(settings.ShortCuts.Reload, ["mod+r", "f5"]),
            GoBack: $Utils.normalize(settings.ShortCuts.GoBack, ["ctrl+alt+left"]),
            GoForward: $Utils.normalize(settings.ShortCuts.GoForward, ["ctrl+alt+right"]),
            ExitHTMLFullscreen: $Utils.normalize(settings.ShortCuts.ExitHTMLFullscreen, ["esc"]),
            ToggleWin32Menu: $Utils.normalize(settings.ShortCuts.ToggleWin32Menu, ["ctrl+h"]),
        },
        URLHandlers: settings.URLHandlers,
        UserAgent: userAgent,
        Permissions: $Utils.normalize(settings.Permissions, ["fullscreen"]),
        AllowPlugins: $Utils.normalize(settings.AllowPlugins, false),
        AllowPopups: $Utils.normalize(settings.AllowPopups, false),
        AllowNewWindows: $Utils.normalize(settings.AllowNewWindows, true),
        ClearTraces: $Utils.normalize(settings.ClearTraces, false),
        SingleInstance: $Utils.normalize(settings.SingleInstance, true),
        FocusOnNewURL: $Utils.normalize(settings.FocusOnNewURL, true),
        HardwareAcceleration: $Utils.normalize(settings.HardwareAcceleration, true),
        ContentProtection: $Utils.normalize(settings.ContentProtection, false),
        Win32MenuState: $Utils.normalize(settings.Win32MenuState, 1),
        Homepage: $Utils.normalize(settings.Homepage, "").trim(),
    };
    if ([0, 1, 2].indexOf(settings.Win32MenuState) === -1) {
        settings.Win32MenuState = 1;
    }
    return settings;
}
