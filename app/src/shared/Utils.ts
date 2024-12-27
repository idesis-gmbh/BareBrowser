import { format as nodeFormat } from "util";
import { $FSE, $Path } from "./Modules";

/**
 * Check a given value if it has the same type as `defaultValue`. If the types don't match, a
 * default value is returned. This function is useful if potentially unsafe values or unknown types
 * (for example from a JSON object) have to be set to a specific type (and default value). __Note:__
 * Using generics instead of `any` enables the TypeScript compiler to detect wrong uses like
 * `normalize("string", true)`.
 * @param value The value to be checked.
 * @param defaultValue The default value to be returned if `value` is of different type than
 * `defaultValue`.
 * @returns A default value or the initial given value.
 */
export function normalize<T>(value: T, defaultValue: T): T {
    if (Array.isArray(value)) {
        // By convention an empty array is OK.
        if (value.length === 0) {
            return value;
        }
        // By convention take the first element in 'defaultValue' as the type reference for all
        // values in 'value'.
        const intendedType: string = typeof (defaultValue as Array<unknown>)[0];
        // If intendedType isn't available type info is lost so lets assume, that the caller isn't
        // really interested in getting a normalized value and therefore 'value' is returned as is.
        // TODO: consider throwing an error instead.
        if (intendedType === "undefined") {
            return value;
        }
        const result = value.filter((entry) => {
            return (typeof entry === intendedType);
        });
        return result as T;
    } else if (typeof value === typeof defaultValue) {
        return value;
    }
    return defaultValue;
}

/**
 * Format a string.
 * @param s The string to be formatted.
 * @param params Params to be inserted in `s`.
 * @returns The formatted string.
 */
export function format(s: string, ...params: unknown[]): string {
    return nodeFormat(s, ...params);
}

/**
 * Read and return a (typed) JSON file.
 * @param fileName The file name f the JSON file.
 * @returns The JSON object as a typed result.
 */
export function requireJSONFile<T>(fileName: string): T {
    return $FSE.readJSONSync(fileName) as T;
}

/**
 * Some common MIME types.
 */
export const MIME_TYPES: Record<string, string> = {
    /* eslint-disable jsdoc/require-jsdoc */
    MP3: "audio/mp3",
    WAV: "audio/wav",
    MID: "audio/midi",
    MIDI: "audio/midi",
    M4A: "audio/x-m4a",
    AAC: "audio/aac",
    OGG: "audio/ogg",
    MP4: "video/mp4",
    MOV: "video/mp4",
    MPG: "video/mpeg",
    MPEG: "video/mpeg",
    PDF: "application/pdf",
    BMP: "image/bmp",
    GIF: "image/gif",
    HEIC: "image/heic",
    HEIF: "image/heif",
    JPG: "image/jpeg",
    JPEG: "image/jpeg",
    PNG: "image/png",
    SVG: "image/svg+xml",
    SVGZ: "image/svg+xml",
    TIF: "image/tiff",
    TIFF: "image/tiff",
    WEBP: "image/webp",
    TXT: "text/plain",
    MD: "text/markdown",
    CSS: "text/css",
    HTM: "text/html",
    HTML: "text/html",
    JS: "text/javascript",
    JSON: "application/json",
    XML: "text/xml",
    ZIP: "application/zip",
    BINARY: "application/octet-stream"
    /* eslint-enable */
};

/**
 * Resolve some common MIME types by file extension.
 * @param extension The file extension.
 * @returns The resolved MIME tye or undefined.
 */
export function getMimeTypeFromFileExtension(extension: string): string | undefined {
    return MIME_TYPES[extension.replace(".", "").toUpperCase()];
}

/**
 * An object containing the directories and files from a directory listing, separated in arrays.
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
 * @param recursive `true` if reading the directory should be executed recursively.
 */
export function fillDirectoryListing(directory: string, outListing: IDirectoryListing, recursive?: boolean): void {
    const entries: string[] = $FSE.readdirSync(directory);
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
    const listing: IDirectoryListing = { Directories: [], Files: [] }; // eslint-disable-line jsdoc/require-jsdoc
    fillDirectoryListing(directory, listing, recursive);
    return listing;
}
