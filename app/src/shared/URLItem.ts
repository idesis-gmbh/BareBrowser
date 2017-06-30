import { $URL } from "./Modules";

/**
 *
 */
export interface URLItem {
    DoLoad: boolean;
    URL: string;
    IsFileURL: boolean;
}

/**
 *
 * @param url
 * @returns URLItem
 */
export function getURLItem(url: string): URLItem {
    url = url.trim();
    if (url === "") {
        return { DoLoad: false, URL: "", IsFileURL: false };
    }
    if (url.startsWith("/")) {
        return { DoLoad: true, URL: "file://" + url, IsFileURL: true };
    }
    const urlLower: string = url.toLowerCase();
    if (urlLower.startsWith("https://") ||
        urlLower.startsWith("http://") ||
        urlLower.startsWith("ftp://") ||
        urlLower.startsWith("file://")) {
        try {
            const parsedUrl: $URL.URL = new $URL.URL(url);
            url = parsedUrl.toString();
            return { DoLoad: true, URL: url, IsFileURL: url.startsWith("file://") };
        } catch (error) {
            console.error(`Invalid URL: ${error}`);
            return { DoLoad: false, URL: "", IsFileURL: false };
        }
    }
    // Simplistic fallback
    return { DoLoad: true, URL: "http://" + url, IsFileURL: false };
}
