import { $FSE } from "./Modules";
import * as $Utils from "./Utils";

/**
 *
 */
export interface Settings {
    Window: {
        Left: number;
        Top: number;
        Width: number;
        Height: number;
    };
    ShortCuts: {
        Global: boolean,
        ToggleAddressBar: string,
        ToggleInternalDevTools: string,
        ToggleDevTools: string,
        FocusLocationBar: string,
        InternalReload: string,
        Reload: string,
        GoBack: string,
        GoForward: string,
    };
    UserAgent: string;
    ClearTraces: boolean;
    SingleInstance: boolean;
    FocusOnNewURL: boolean;
}

/**
 *
 * @returns Settings
 */
export function getDefaultSettings(): Settings {
    return {
        Window: {
            Left: 50,
            Top: 50,
            Width: 1000,
            Height: 1000,
        },
        ShortCuts: {
            Global: true,
            ToggleAddressBar: "ctrl+alt+a",
            ToggleInternalDevTools: "ctrl+alt+i",
            ToggleDevTools: "ctrl+alt+d",
            FocusLocationBar: "ctrl+alt+l",
            InternalReload: "ctrl+alt+shift+r",
            Reload: "ctrl+alt+r",
            GoBack: "ctrl+alt+left",
            GoForward: "ctrl+alt+right",
        },
        UserAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
        ClearTraces: true,
        SingleInstance: true,
        FocusOnNewURL: true,
    };
}

/**
 *
 * @param configFile
 * @returns Settings
 */
export function getSettings(configFile: string): Settings {
    let settings: Settings;
    try {
        settings = $FSE.readJsonSync(configFile);
    } catch (error) {
        console.error("Could't read configuration file", configFile, error);
        return getDefaultSettings();
    }
    settings = {
        Window: {
            Left: settings.Window.Left || 50,
            Top: settings.Window.Top || 50,
            Width: settings.Window.Width || 1000,
            Height: settings.Window.Height || 1000,
        },
        ShortCuts: {
            Global: settings.ShortCuts.Global !== undefined ? settings.ShortCuts.Global: true,
            ToggleAddressBar: $Utils.normalizeString(settings.ShortCuts.ToggleAddressBar, "ctrl+alt+a"),
            ToggleInternalDevTools: $Utils.normalizeString(settings.ShortCuts.ToggleInternalDevTools, "ctrl+alt+i"),
            ToggleDevTools: $Utils.normalizeString(settings.ShortCuts.ToggleDevTools, "ctrl+alt+dx"),
            FocusLocationBar: $Utils.normalizeString(settings.ShortCuts.FocusLocationBar, "ctrl+alt+l"),
            InternalReload: $Utils.normalizeString(settings.ShortCuts.InternalReload, "ctrl+alt+shift+r"),
            Reload: $Utils.normalizeString(settings.ShortCuts.Reload, "ctrl+alt+r"),
            GoBack: $Utils.normalizeString(settings.ShortCuts.GoBack, "ctrl+alt+left"),
            GoForward: $Utils.normalizeString(settings.ShortCuts.GoForward, "ctrl+alt+right"),
        },
        UserAgent: settings.UserAgent || (typeof navigator === "undefined" ? "" : navigator.userAgent),
        ClearTraces: settings.ClearTraces !== undefined ? settings.ClearTraces: true,
        SingleInstance: settings.SingleInstance !== undefined ? settings.SingleInstance: true,
        FocusOnNewURL: settings.FocusOnNewURL !== undefined ? settings.FocusOnNewURL: true,
    };
    return settings;
}
