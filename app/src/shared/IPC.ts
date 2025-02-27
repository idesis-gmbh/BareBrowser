/**
 * IPC channel name for communication between main and renderer process.
 */
export const IPC_MAIN_RENDERER = "IPC_APP_RENDERER";

/**
 * IPC channel name for communication between web view and renderer process.
 */
export const IPC_WEBVIEW_RENDERER = "IPC_WEBVIEW_RENDERER";

/**
 * IPC channel name for communication between preload script and main process.
 */
export const IPC_PRELOAD_MAIN = "IPC_WEBVIEW_APP";

/**
 * Structure of IPC messages.
 */
export interface IIPCMessage {
    /**
     * Numeric message id.
     */
    readonly Id: IPC;
    /**
     * Corresponding text.
     */
    readonly Text: string;
}

/**
 * Ids for IPC messages between the main process, the renderer process and the web view.
 */
export const enum IPC {
    UNKNOWN = 0,
    ERROR,
    DEBUG,
    LOAD_URL,
    RELOAD_URL,
    GO_BACK,
    GO_FORWARD,
    WINDOW_CREATED,
    QUERY_INITIAL_URL_ITEM,
    GET_SETTINGS,
    RENDERER_READY,
    SET_WINDOW_TITLE,
    TOGGLE_MENU,
    NEW_WINDOW,
    TOGGLE_INTERNAL_DEV_TOOLS,
    GET_SCROLL_OFFSET,
    SET_SCROLL_OFFSET,
    SCROLL_TO_OFFSET,
    KEYBOARD_EVENT,
    SHOW_CONTEXT_MENU
}

/* eslint-disable jsdoc/require-jsdoc */
/**
 * Unknown IPC message.
 */
export const IPC_UNKNOWN: IIPCMessage = {
    Id: IPC.UNKNOWN,
    Text: "Unknown IPC message with params:",
};
/**
 * All known IPC message objects.
 */
export const IPC_ERROR: IIPCMessage = {
    Id: IPC.ERROR,
    Text: "An error occured: %s",
};
export const IPC_DEBUG: IIPCMessage = {
    Id: IPC.DEBUG,
    Text: "",
};
export const IPC_LOAD_URL_ITEM: IIPCMessage = {
    Id: IPC.LOAD_URL,
    Text: "",
};
export const IPC_RELOAD_URL_ITEM: IIPCMessage = {
    Id: IPC.RELOAD_URL,
    Text: "",
};
export const IPC_GO_BACK: IIPCMessage = {
    Id: IPC.GO_BACK,
    Text: "",
};
export const IPC_GO_FORWARD: IIPCMessage = {
    Id: IPC.GO_FORWARD,
    Text: "",
};
export const IPC_WINDOW_CREATED: IIPCMessage = {
    Id: IPC.WINDOW_CREATED,
    Text: "",
};
export const IPC_QUERY_INITIAL_URL_ITEM: IIPCMessage = {
    Id: IPC.QUERY_INITIAL_URL_ITEM,
    Text: "",
};
export const IPC_GET_SETTINGS: IIPCMessage = {
    Id: IPC.GET_SETTINGS,
    Text: "",
};
export const IPC_RENDERER_READY: IIPCMessage = {
    Id: IPC.RENDERER_READY,
    Text: "",
};
export const IPC_SET_WINDOW_TITLE: IIPCMessage = {
    Id: IPC.RENDERER_READY,
    Text: "",
};
export const IPC_TOGGLE_MENU: IIPCMessage = {
    Id: IPC.TOGGLE_MENU,
    Text: "",
};
export const IPC_NEW_WINDOW: IIPCMessage = {
    Id: IPC.NEW_WINDOW,
    Text: "",
};
export const IPC_TOGGLE_INTERNAL_DEV_TOOLS: IIPCMessage = {
    Id: IPC.TOGGLE_INTERNAL_DEV_TOOLS,
    Text: "",
};
export const IPC_GET_SCROLL_OFFSET: IIPCMessage = {
    Id: IPC.GET_SCROLL_OFFSET,
    Text: "",
};
export const IPC_SET_SCROLL_OFFSET: IIPCMessage = {
    Id: IPC.SET_SCROLL_OFFSET,
    Text: "",
};
export const IPC_SCROLL_TO_OFFSET: IIPCMessage = {
    Id: IPC.SCROLL_TO_OFFSET,
    Text: "",
};
export const IPC_KEYBOARD_EVENT: IIPCMessage = {
    Id: IPC.KEYBOARD_EVENT,
    Text: "",
};
export const IPC_SHOW_CONTEXT_MENU: IIPCMessage = {
    Id: IPC.SHOW_CONTEXT_MENU,
    Text: "",
};
/* eslint-enable */

/** 
 * Get an IPC message by id.
 * @param id The message id.
 * @returns An IPC message object matching the given id.
 */
export function getIPCMessage(id: number): IIPCMessage {
    switch (<IPC>id) {
        case IPC.ERROR: return IPC_ERROR;
        case IPC.DEBUG: return IPC_DEBUG;
        case IPC.LOAD_URL: return IPC_LOAD_URL_ITEM;
        case IPC.RELOAD_URL: return IPC_RELOAD_URL_ITEM;
        case IPC.GO_BACK: return IPC_GO_BACK;
        case IPC.GO_FORWARD: return IPC_GO_FORWARD;
        case IPC.WINDOW_CREATED: return IPC_WINDOW_CREATED;
        case IPC.QUERY_INITIAL_URL_ITEM: return IPC_QUERY_INITIAL_URL_ITEM;
        case IPC.GET_SETTINGS: return IPC_GET_SETTINGS;
        case IPC.RENDERER_READY: return IPC_RENDERER_READY;
        case IPC.SET_WINDOW_TITLE: return IPC_SET_WINDOW_TITLE;
        case IPC.TOGGLE_MENU: return IPC_TOGGLE_MENU;
        case IPC.NEW_WINDOW: return IPC_NEW_WINDOW;
        case IPC.GET_SCROLL_OFFSET: return IPC_GET_SCROLL_OFFSET;
        case IPC.TOGGLE_INTERNAL_DEV_TOOLS: return IPC_TOGGLE_INTERNAL_DEV_TOOLS;
        case IPC.SET_SCROLL_OFFSET: return IPC_SET_SCROLL_OFFSET;
        case IPC.SCROLL_TO_OFFSET: return IPC_SCROLL_TO_OFFSET;
        case IPC.KEYBOARD_EVENT: return IPC_KEYBOARD_EVENT;
        case IPC.SHOW_CONTEXT_MENU: return IPC_SHOW_CONTEXT_MENU;
        // eslint-disable-next-line jsdoc/require-jsdoc
        default: return { Id: IPC.UNKNOWN, Text: `Unknown IPC message (ID ${id}) received with params:` };
    }
}
