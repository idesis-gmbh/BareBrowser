import { $FSE, $Path } from "./Modules";

/**
 *
 * @param value T
 * @param defaultValue T
 * @returns T
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
    return defaultValue as T;
}

/**
 *
 */
export interface DirectoryListing {
    Directories: string[];
    Files: string[];
}

/**
 *
 * @param directory
 * @param outListing
 * @param recursive
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
 *
 * @param directory
 * @param recursive
 * @returns DirectoryListing
 */
export function getDirectoryListing(directory: string, recursive?: boolean): DirectoryListing {
    const listing: DirectoryListing = { Directories: [], Files: [] };
    fillDirectoryListing(directory, listing, recursive);
    return listing;
}
