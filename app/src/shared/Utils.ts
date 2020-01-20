import { $FSE, $Path } from "./Modules";

/**
 * Check a given value if it has the same type as `defaultValue`.
 * If the types don't match, a default value is returned. This function is
 * useful if potentially unsafe values or unknown types (for example from
 * a JSON object) have to be set to a specific type (and default value).
 * *Note:* Using generics instead of `any` enables the TypeScript compiler
 * to detect wrong uses like `normalize("string", true)`.
 * @param value The value to be checked.
 * @param defaultValue The default value to be returned if `value` is of different type than `defaultValue`.
 * @returns A default value or the initial given value.
 */
export function normalize<T>(value: T, defaultValue: T): T {
    if (Array.isArray(value)) {
        // By convention an empty array is OK
        if (value.length === 0) {
            return value;
        }
        // By convention take the first element in 'defaultValue'
        // as the type reference for all values in 'value'.
        const intendedType: string = typeof defaultValue[0];
        // If intendedType isn't available type info is lost so lets
        // assume, that the caller isn't really interested in getting
        // a normalized value and therefore 'value' is returned as is.
        // TODO: consider throwing an error instead.
        if (intendedType === "undefined") {
            return value;
        }
        const result: {} = value.filter((entry: {}) => {
            return (typeof entry === intendedType);
        });
        return result as T;
    } else if (typeof value === typeof defaultValue) {
        return value;
    }
    return defaultValue;
}

/**
 * An object conatining the directories and files
 * from a directory listing, separated in arrays.
 */
export interface IDirectoryListing {
    /**
     * An array containing directories names.
     */
    Directories: string[];
    /**
     * An array containing file names.
     */
    Files: string[];
}

/**
 * Fill a DirectoryListing object with the contents from `directory`.
 * @param directory The path for which the directory listing should be executed.
 * @param outListing A DirectoryListing object which receives the result of reading the contents of `directory`.
 * @param recursive `True` if reading the directory should be executed recursively.
 */
export function fillDirectoryListing(directory: string, outListing: IDirectoryListing, recursive?: boolean): void {
    const entries: string[] = $FSE.readdirSync(directory);
    outListing.Directories.push(directory);
    for (const entry of entries) {
        const resolvedFile: string = $Path.resolve(directory, entry);
        if ($FSE.lstatSync(resolvedFile).isDirectory()) {
            outListing.Directories.push(resolvedFile);
            if (recursive) {
                fillDirectoryListing(resolvedFile, outListing, recursive);
            }
        } else {
            outListing.Files.push(resolvedFile);
        }
    }
}

/**
 * Read the contents of a directory.
 * @param directory The path for which the directory listing should be executed.
 * @param recursive True if reading the directory should be executed recursively.
 * @returns A DirectoryListing object which contains the result of reading the contents of `directory`.
 */
export function getDirectoryListing(directory: string, recursive?: boolean): IDirectoryListing {
    const listing: IDirectoryListing = { Directories: [], Files: [] };
    fillDirectoryListing(directory, listing, recursive);
    return listing;
}

/**
 * Checks, if two URLs are the same after the hash has been removed from both URLs.
 * @param URL1 URL to compare.
 * @param URL2 URL to compare.
 * @returns true if both URLs are the same.
 */
export function compareBaseURLs(URL1: string, URL2: string): boolean {
    if (URL1 === URL2) {
        return true;
    }
    let url1: $URL.URL | undefined;
    if (URL1) {
        try {
            url1 = new $URL.URL(URL1);
        } catch (error) {
            return false;
        }
        url1.hash = "";
    }
    let url2: $URL.URL | undefined;
    if (URL2) {
        try {
            url2 = new $URL.URL(URL2);
        } catch (error) {
            return false;
        }
        url2.hash = "";
    }
    if (url1 && url2) {
        return url1.toString() === url2.toString();
    }
    return false;
}
