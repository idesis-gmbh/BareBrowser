import normalizeUrl from "normalize-url";

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
    let result: URLItem;
    if (url.trim() === "") {
        result = { DoLoad: false, URL: "", IsFileURL: false };
        return result;
    }
    try {
        url = normalizeUrl(url.replace(/^\s+/, ""), { // Trim left
            normalizeProtocol: true,
            normalizeHttps: false,
            stripFragment: false,
            stripWWW: false,
            removeQueryParameters: [],
            removeTrailingSlash: false,
            removeDirectoryIndex: [],
        });
        // Assume a local filename if url starts with "/", anything else is considered to be http if protocol is missing
        // tslint:disable-next-line:prefer-conditional-expression
        if (url.startsWith("/")) {
            result = { DoLoad: true, URL: "file://" + url, IsFileURL: true };
        } else if (
            url.startsWith("https://") ||
            url.startsWith("http://") ||
            url.startsWith("ftp://") ||
            url.startsWith("file://")) {
            result = { DoLoad: true, URL: url, IsFileURL: url.startsWith("file://") };
        } else {
            // Fallback, shouldn't happen with normalizeUrl
            result = { DoLoad: true, URL: "http://" + url, IsFileURL: false };
        }
    } catch (error) {
        console.error("getURLItem:", error);
        result = { DoLoad: false, URL: "", IsFileURL: false};
    }
    return result;
}
