
/**
 * A module with common modules exports used by both the main and renderer process.
 */
/* eslint-disable */
import * as fse from "fs-extra"; // Also exports anything from 'fs'
import * as os from "os";
import * as path from "path";
import * as url from "url";
export { fse as $FSE };
export { os as $OS };
export { path as $Path };
export { url as $URL };
/* eslint-enable */
