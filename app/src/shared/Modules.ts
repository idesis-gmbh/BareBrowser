/**
 * A module with common modules exports used by both the main and renderer process.
 */
import * as path from "path";
export { path as $Path };

import * as url from "url";
export { url as $URL };

import * as os from "os";
export {os as $OS};

import * as fse from "fs-extra"; // Also exports anything from 'fs'
export { fse as $FSE };
