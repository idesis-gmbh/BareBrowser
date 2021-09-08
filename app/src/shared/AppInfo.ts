import { $OS, $Path } from "./Modules";
import { requireJSONFile } from "./Utils";

/**
 * General app information.
 */
export interface IAppInfo {
    readonly Name: string;
    readonly ProductName: string;
    readonly Description: string;
    readonly CompanyName: string;
    readonly Copyright: string;
    readonly Version: string;
    readonly Identifier: string;
    readonly IdentifierRoot: string;
    readonly ExeName: string;
    readonly ProcessExeName: string;
    readonly Homepage: string;
    readonly AuthorName: string;
    readonly AuthorEmail: string;
    // - If the app is packaged, the following paths point to directories inside the file `app.asar`.
    // - In development mode (not packaged) they point to real directories (./out/...).
    readonly APP_PATH_PKG: string;
    readonly LIB_PATH_PKG: string;
    readonly RES_PATH_PKG: string;
    readonly STYLE_PATH_PKG: string;
    // If the following paths exist in the real file system during runtime depends entirely on how
    // the app is packaged, see param `--asar.unpackDir` in config.pkgParams in package.json.
    // In development mode, they are mapped to real directories (./out/...)
    readonly APP_PATH: string;
    readonly RES_PATH: string;
    readonly LIB_PATH: string;
    readonly STYLE_PATH: string;
    //
    readonly Platform: string;
    readonly OSVersion: string;
    readonly ElectronVersion: string;
    readonly ChromeVersion: string;
    readonly NodeVersion: string;
    readonly IsPackaged: boolean;
}

/** 
 * The structure of the package.json file for the app.
 * Used to create objects based on @see IAppInfo.
 */
interface IAppPackageJSON {
    name: string;
    productName: string;
    description: string;
    companyname: string;
    copyright: string;
    version: string;
    identifier: string;
    identifierRoot: string;
    executableName: string;
    homepage: string;
    author: {
        name: string;
        email: string;
    },
    darwinAppCategory: string;
    win32FileDescription: string;
    win32InternalName: string;
    win32RequestedExecutionLevel: string;
    win32ApplicationManifest: string;
}

// Is app packaged?
const __platform__ = process.platform;
let __isPackaged__;
const __exeName__ = $Path.basename(process.execPath).toLowerCase();
if (process.type === "browser") {
    __isPackaged__ = __platform__ === 'win32' ? __exeName__ !== "electron.exe" : __exeName__ !== "electron";
} else {
    __isPackaged__ = __platform__ === 'win32' ? __exeName__ !== "electron.exe" : __exeName__ !== "electron helper (renderer)";
}

// Get app root path (packaged).
let __appPathPkg__ = "";
if (process.type === "browser") {
    // Assumes, that MainProcess.js is always located in ./bin/
    __appPathPkg__ = $Path.join(__dirname, "/../");
} else {
    // A Renderer process has this as a command line argument.
    for (const arg of process.argv) {
        if (arg.startsWith("--app-path=")) {
            __appPathPkg__ = $Path.join(arg.substring(11), $Path.sep);
            break;
        }
    }
}
// Get app root path (unpackaged).
let __appPath__;
if (__isPackaged__) {
    __appPath__ = $Path.join($Path.resolve(__appPathPkg__, `../app.asar.unpacked/`), $Path.sep);
} else {
    __appPath__ = __appPathPkg__;
}

// Load package.json of the app.
const __packageJSON__ = requireJSONFile<IAppPackageJSON>($Path.resolve(__appPathPkg__, "package.json"));

/**
 * Constant holding common app information, partially read from package.json.
 */
export const APP_INFO: IAppInfo = {
    /* eslint-disable jsdoc/require-jsdoc */
    Name: __packageJSON__.name,
    ProductName: __packageJSON__.productName,
    Description: __packageJSON__.description,
    CompanyName: __packageJSON__.companyname,
    Copyright: __packageJSON__.copyright,
    Version: __packageJSON__.version,
    Identifier: __packageJSON__.identifier,
    IdentifierRoot: __packageJSON__.identifierRoot ? __packageJSON__.identifierRoot.trim() : "",
    ExeName: __packageJSON__.executableName,
    ProcessExeName: process.argv0,
    Homepage: __packageJSON__.homepage,
    AuthorName: __packageJSON__.author.name,
    AuthorEmail: __packageJSON__.author.email,
    // See interface IAppInfo for these paths.
    APP_PATH_PKG: __appPathPkg__,
    LIB_PATH_PKG: $Path.join(__appPathPkg__, `lib${$Path.sep}`),
    RES_PATH_PKG: $Path.join(__appPathPkg__, `res${$Path.sep}`),
    STYLE_PATH_PKG: $Path.join(__appPathPkg__, `style${$Path.sep}`),
    APP_PATH: __appPath__,
    LIB_PATH: $Path.join(__appPath__, `lib${$Path.sep}`),
    RES_PATH: $Path.join(__appPath__, `res${$Path.sep}`),
    STYLE_PATH: $Path.join(__appPath__, `style${$Path.sep}`),
    //
    Platform: __platform__,
    OSVersion: `${$OS.type()} ${$OS.release()} ${$OS.arch()}`,
    ElectronVersion: process.versions.electron,
    ChromeVersion: process.versions.chrome,
    NodeVersion: process.versions.node,
    IsPackaged: __isPackaged__,
    /* eslint-enable */
};
