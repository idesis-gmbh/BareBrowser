import * as $Consts from "../shared/Consts";
import { $URL } from "./Modules";

/**
 * Interface for URL items.
 */
export interface IURLItem {
    /**
     * Should this item be loaded or not?
     */
    DoLoad: boolean;
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
}

/**
 * Creates a URLItem object from a given string.
 * This can result in either a URL for the web (http://) or a file (file://).
 * @param url The URL string to be parsed.
 * @returns A URLItem object.
 */
export function getURLItem(url: string): IURLItem {
    url = url.trim();
    if (url === "") {
        return { DoLoad: false, OriginalURL: url, URL: "", IsFileURL: false };
    }
    if ((url === $Consts.CMD_QUIT) || ((url === $Consts.CMD_URL_QUIT))) {
        return { DoLoad: false, OriginalURL: url, URL: $Consts.CMD_QUIT, IsFileURL: false };
    }
    if (url.startsWith("/")) {
        return { DoLoad: true, OriginalURL: url, URL: "file://" + url, IsFileURL: true };
    }
    const urlLower: string = url.toLowerCase();
    if (urlLower.startsWith("https://") ||
        urlLower.startsWith("http://") ||
        urlLower.startsWith("ftp://") ||
        urlLower.startsWith("file://")) {
        try {
            const parsedUrl: $URL.URL = new $URL.URL(url);
            return { DoLoad: true, OriginalURL: url, URL: parsedUrl.toString(), IsFileURL: url.startsWith("file://") };
        } catch (error) {
            console.error(`Invalid URL: ${error}`);
            return { DoLoad: false, OriginalURL: url, URL: "", IsFileURL: false };
        }
    }
    // Simplistic fallback
    return { DoLoad: true, OriginalURL: url, URL: "http://" + url, IsFileURL: false };
}
