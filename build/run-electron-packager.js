// Configure and run electron-packager

// Checks
const targetPlatform = process.argv[3];
if ((targetPlatform !== "darwin") && (targetPlatform !== "win32")) {
    console.error("%s: Unknown platform: %s", process.argv[1], targetPlatform);
    process.exit(1);
}
if (targetPlatform === "darwin") {
    if (process.platform === "win32") {
        console.error("%s: Packaging darwin on win32 creates unusable files, skipping...", process.argv[1]);
        process.exit(1);
    }
}

const proc = require("child_process");
const fse = require("fs-extra");
const path = require("path");

// package.json of ./app/
const apppj = fse.readJsonSync(process.argv[2]);

// Default params
const packagerParams = apppj.config.pkgParams.split(" ");
packagerParams.push(
    "./out/",
    `"${apppj.productName}"`,
    "--out=./release/",
    "--no-prune",
    "--download.cacheRoot=./build/tmp/.electron-download",
    "--overwrite",
    `--executable-name="${apppj.executableName}"`,
    `--app-version="${apppj.version}"`,
    `--electron-version="${apppj.devDependencies.electron}"`,
    `--arch="${apppj.config.arch}"`,
);
if (apppj.buildVersion !== undefined) {
    packagerParams.push(`--build-version="${apppj.buildVersion}"`);
}
if (apppj.copyright) {
    packagerParams.push(`--app-copyright="${apppj.copyright}"`);
}

// Platform specific params
if (targetPlatform === "darwin") {
    packagerParams.push(
        "--platform=darwin",
        "--icon=./build/tmp/appicon.icns",
    );
    if (apppj.identifier) {
        packagerParams.push(`--app-bundle-id="${apppj.identifier}"`);
    }
    if (apppj.darwinAppCategory) {
        packagerParams.push(`--app-category-type="${apppj.darwinAppCategory}"`);
    }
    console.log(`///// Making darwin x64 release of ${apppj.productName} ${apppj.version} ...`);
} else if (targetPlatform === "win32") {
    packagerParams.push(
        "--platform=win32",
        "--icon=./build/tmp/appicon.ico",
    );
    if (apppj.companyname) {
        packagerParams.push(`--win32metadata.CompanyName="${apppj.companyname}"`);
    }
    if (apppj.win32FileDescription) {
        packagerParams.push(`--win32metadata.FileDescription="${apppj.win32FileDescription}"`);
    }
    if (apppj.productName) {
        packagerParams.push(`--win32metadata.OriginalFilename="${apppj.productName}.exe"`);
    }
    if (apppj.productName) {
        packagerParams.push(`--win32metadata.ProductName="${apppj.productName}"`);
    }
    if (apppj.win32InternalName) {
        packagerParams.push(`--win32metadata.InternalName="${apppj.win32InternalName}"`);
    }
    if (apppj.win32RequestedExecutionLevel) {
        packagerParams.push(`--win32metadata.requested-execution-level="${apppj.win32RequestedExecutionLevel}"`);
    }
    if (apppj.win32ApplicationManifest) {
        packagerParams.push(`--win32metadata.applicationManifest="${apppj.win32ApplicationManifest}"`);
    }
    console.log(`///// Making win32 ${apppj.config.arch} release of ${apppj.productName} ${apppj.version} ...`);
}
//console.log(packagerParams);

// Run packager
const exitCode = proc.spawnSync(
    path.join(__dirname, "..", "node_modules", ".bin",
        (process.platform === "win32") ? "electron-packager.cmd" : "electron-packager"),
    packagerParams,
    { shell: true, stdio: "inherit" },
).status;

// Rename all existing release build paths to contain the version.
if (exitCode === 0) {
    const outputRootName = path.join(__dirname, "..", "release", apppj.productName).replace(/\\/g, "/");
    const outputPaths = [outputRootName + "-darwin-x64", outputRootName + "-win32-x64", outputRootName + "-win32-ia32"];
    const regexp = new RegExp(`${outputRootName}(?![\s\S]*${outputRootName})`);
    for (var i = 0; i < outputPaths.length; i++) {
        if (fse.existsSync(outputPaths[i])) {
            var versionedName = outputPaths[i].replace(regexp, outputRootName + "-" + apppj.version);
            if (fse.existsSync(versionedName)) {
                fse.removeSync(versionedName);
            }
            fse.renameSync(outputPaths[i], versionedName);
        }
    }
}

process.exit(exitCode);
