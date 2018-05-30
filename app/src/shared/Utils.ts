import { $FSE, $Path } from "./Modules";

/**
 * Check a given value if it has the same type as `defaultValue`.
 * If the types don't match, a default value is returned. This function is
 * useful if potentially unsafe values or unknown types (for example from
 * a JSON object) have to be set to a specific type (and default value).
 * *Note:* Using generics instead of `any` enables the TypeScript compiler
 * to detect wrong uses like `normalize("string", true)`.
 * @param {T} value The value to be checked.
 * @param {T} defaultValue The default value to be returned if `value` is of different type than `defaultValue`.
 * @returns {T} A default value or the initial given value.
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
export interface DirectoryListing {
    Directories: string[];
    Files: string[];
}

/**
 * Fill a DirectoryListing object with the contents from `directory`.
 * @param {string} directory The path for which the directory listing should be executed.
 * @param {DirectoryListing} outListing A DirectoryListing object which receives the result of reading the contents of `directory`.
 * @param {boolean} recursive `True` if reading the directory should be executed recursively.
 */
export function fillDirectoryListing(directory: string, outListing: DirectoryListing, recursive?: boolean): void {
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
 * @param {string} directory The path for which the directory listing should be executed.
 * @param {boolean} recursive True if reading the directory should be executed recursively.
 * @returns {DirectoryListing} A DirectoryListing object which contains the result of reading the contents of `directory`.
 */
export function getDirectoryListing(directory: string, recursive?: boolean): DirectoryListing {
    const listing: DirectoryListing = { Directories: [], Files: [] };
    fillDirectoryListing(directory, listing, recursive);
    return listing;
}
