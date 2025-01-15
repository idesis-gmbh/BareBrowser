import * as $Consts from "../shared/Consts";
import { $Path, $URL } from "./Modules";

/**
 * Interface for URL items.
 */
export interface IURLItem {
    /**
     *  The original given URL.
     */
    OriginalURL: string;
    /**
     * Fully expanded URL string.
     */
    URL: string;
    /**
     * Is the URL a file?
     */
    IsFileURL: boolean;
    /**
     * Should this item be loaded or not?
     */
    DoLoad: boolean;
}

/**
 * Creates a URLItem object from a given string. This can result in either a URL for the web
 * (`https://`) or a file (`file://`).
 * @param url The URL string to be parsed.
 * @param scheme A custom protocol scheme.
 * @returns A URLItem object.
 */
export function getURLItem(url: string, scheme?: string): IURLItem {
    /* eslint-disable jsdoc/require-jsdoc */
    url = url
        .trim()
        .replace(/^"/, "")
        .replace(/^'/, "")
        .replace(/"$/, "")
        .replace(/'$/, "");
    if (url === "") {
        return { OriginalURL: url, URL: "", IsFileURL: false, DoLoad: false };
    }
    // Quit.
    if (url === $Consts.CMD_QUIT) {
        return { OriginalURL: url, URL: $Consts.CMD_QUIT, IsFileURL: false, DoLoad: false };
    }
    // Clear traces.
    if (url === $Consts.CMD_CLEAR_TRACES) {
        return { OriginalURL: url, URL: $Consts.CMD_CLEAR_TRACES, IsFileURL: false, DoLoad: false };
    }
    // A relative or absolute file path.
    if (url.startsWith(".") || url.startsWith("/")) {
        const fileURL = url.startsWith(".") ? $Path.resolve(url) : url;
        try {
            return { OriginalURL: url, URL: new $URL.URL("file://" + fileURL).toString(), IsFileURL: true, DoLoad: true };
        } catch (error) {
            console.error(`Invalid URL: ${error}`);
            return { OriginalURL: url, URL: "", IsFileURL: true, DoLoad: false };
        }
    }
    // Internal resources
    if (url.startsWith("data:text/html,")) {
        return { OriginalURL: url, URL: url, IsFileURL: false, DoLoad: true };
    }
    // Regular resources
    const urlLower: string = url.toLowerCase();
    if (urlLower.startsWith("https://") ||
        urlLower.startsWith("http://") ||
        urlLower.startsWith("file://") ||
        (scheme && urlLower.startsWith(scheme))) {
        try {
            return { OriginalURL: url, URL: new $URL.URL(url).toString(), IsFileURL: url.startsWith("file://"), DoLoad: true };
        } catch (error) {
            console.error(`Invalid URL: ${error}`);
            return { OriginalURL: url, URL: "", IsFileURL: false, DoLoad: false };
        }
    }
    // Simplistic fallback
    return { OriginalURL: url, URL: "https://" + url, IsFileURL: false, DoLoad: true };
    /* eslint-enable */
}

/**
 * Make a URL of a string.
 * @param url The URL string.
 * @returns A URL or undefined.
 */
function getURL(url: string): $URL.URL | undefined {
    try {
        return new $URL.URL(url);
    } catch (error) {
        return undefined;
    }
}

/**
 * Checks, if two URLs are the same after the hash has been removed from both URLs.
 * @param URL1 URL to compare.
 * @param URL2 URL to compare.
 * @returns true if both URLs are the same.
 */
export function compareURLs(URL1: string, URL2: string): boolean {
    if (URL1 === URL2) {
        return true;
    }
    const url1 = getURL(URL1);
    const url2 = getURL(URL2);
    if (url1 && url2) {
        url1.hash = "";
        url2.hash = "";
        return url1.toString() === url2.toString();
    }
    return false;
}

/**
 * Checks, if two URLs have the same origin.
 * @param URL1 URL to compare.
 * @param URL2 URL to compare.
 * @returns true if both URLs have the same origin the same.
 */
export function isSameOrigin(URL1: string, URL2: string): boolean {
    if (URL1 === URL2) {
        return true;
    }
    const url1 = getURL(URL1);
    const url2 = getURL(URL2);
    if (url1 && url2) {
        return url1.origin === url2.origin;
    }
    return false;
}
