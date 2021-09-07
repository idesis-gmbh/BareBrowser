// Run specified release build
const platform = process.argv[3];

// Checks
if (!["darwin", "linux", "win32"].includes(platform)) {
    console.error("%s: Unknown platform: %s", process.argv[1], platform);
    process.exit(1);
}
if (platform !== process.platform) {
    console.error("%s: Cannot run %s release on %s", process.argv[1], process.argv[3], process.platform);
    process.exit(1);
}

const proc = require("child_process");
const fse = require("fs-extra");
const path = require("path");

// package.json of ./app/
const apppj = fse.readJsonSync(process.argv[2]);

if (["darwin", "linux"].includes(platform)) {
    const params = [
        "-n",
        path.join("release", `${apppj.productName}-${apppj.version}-${platform}-${process.arch}`, `${apppj.productName}.app`).replace(/\ /g, "\\\ ")
    ];
    console.log(`///// Running current ${platform}-${process.arch} release of %s`, apppj.productName);
    process.exit(proc.spawnSync("open", params, { shell: true, stdio: "inherit" }).status);
} else if (platform === "win32") {
    const executable = "\""
        + path.join("release", `${apppj.productName}-${apppj.version}-${platform}-${process.arch}`, `${apppj.executableName}.exe`)
        + "\"";
    console.log(`///// Running current ${platform}-${process.arch} release of %s`, apppj.productName);
    proc.spawn(executable, [], { detached: true, shell: true });
    process.exit(0);
}
