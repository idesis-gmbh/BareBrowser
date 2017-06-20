
/**
 *
 * @param str
 * @param defaultValue
 * @returns string
 */
export function normalizeString(str: string, defaultValue: string): string {
    if (str === null) {
        return "";
    } else if ((str === undefined) || (typeof str !== "string")) {
        return defaultValue;
    } else if (str.trim() !== "") {
        return str.trim();
    }
    return "";
}
