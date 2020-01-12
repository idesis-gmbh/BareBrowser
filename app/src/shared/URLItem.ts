import * as $Consts from "../shared/Consts";
import { $URL } from "./Modules";

/**
 * Interface for the origin of URL items.
 */
export enum URLSource {
    /**
     * Created by the app itself.
     */
    APP = 0,
    /**
     * URL was manually entered by the user.
     */
    USER,
    /**
     * URL was created by, for example, clicking on a link or
     * by the page itself by rewriting `window.location`.
     */
    PAGE,
    /**
     * URL was created by opening a new window.
     */
    NEW_WINDOW,
    /**
     * URL was given by command line.
     */
    CMD_LINE,
}

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
    /**
     * 'Who' created/issued the URL.
     */
    Source: URLSource;
}

/**
 * Creates a URLItem object from a given string.
 * This can result in either a URL for the web (http://) or a file (file://).
 * @param url The URL string to be parsed.
 * @param source 'Who' created/issued the URL.
 * @returns A URLItem object.
 */
export function getURLItem(url: string, source: URLSource): IURLItem {
    url = url
        .trim()
        .replace(/^"/, "")
        .replace(/^'/, "")
        .replace(/"$/, "")
        .replace(/'$/, "");
    if (url === "") {
        return { DoLoad: false, OriginalURL: url, URL: "", IsFileURL: false, Source: source };
    }
    if ((url === $Consts.CMD_QUIT) || ((url === $Consts.CMD_URL_QUIT))) {
        return { DoLoad: false, OriginalURL: url, URL: $Consts.CMD_QUIT, IsFileURL: false, Source: source };
    }
    if (url.startsWith("/")) {
        return { DoLoad: true, OriginalURL: url, URL: "file://" + url, IsFileURL: true, Source: source };
    }
    const urlLower: string = url.toLowerCase();
    if (urlLower.startsWith("https://") ||
        urlLower.startsWith("http://") ||
        urlLower.startsWith("ftp://") ||
        urlLower.startsWith("file://")) {
        try {
            const parsedUrl: $URL.URL = new $URL.URL(url);
            return { DoLoad: true, OriginalURL: url, URL: parsedUrl.toString(), IsFileURL: url.startsWith("file://"), Source: source };
        } catch (error) {
            console.error(`Invalid URL: ${error}`);
            return { DoLoad: false, OriginalURL: url, URL: "", IsFileURL: false, Source: source };
        }
    }
    // Simplistic fallback
    return { DoLoad: true, OriginalURL: url, URL: "http://" + url, IsFileURL: false, Source: source };
}
