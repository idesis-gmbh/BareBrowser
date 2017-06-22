// Run specified release build

//Checks
if (process.argv[3] == "darwin") {
    if (process.platform != "darwin") {
        console.error("%s: Cannot run darwin release on %s", process.argv[1], process.platform);
        process.exit(1);
    }
} else if (process.argv[3] == "win32") {
    if (process.platform != "win32") {
        console.error("%s: Cannot run win32 release on %s", process.argv[1], process.platform);
        process.exit(1);
    }
} else {
    console.error("%s: Unknown platform: %s", process.argv[1], process.argv[4]);
    process.exit(1);
}

const proc = require("child_process");
const fse = require("fs-extra");
const path = require("path");

// package.json of ./app/
const apppj = fse.readJsonSync(process.argv[2]);

if (process.argv[3] == "darwin") {
    const params = [
        "-n",
        path.join("release", `${apppj.productName}-darwin-x64`, `${apppj.productName}.app`).replace(/\ /g, "\\\ ")
    ];
    console.log("///// Running current darwin-x64 release of %s", apppj.productName);
    process.exit(proc.spawnSync("open", params, { shell: true, stdio: "inherit" }).signal);
} else if (process.argv[3] == "win32") {
    const executable = "\"" + path.join("release", `${apppj.productName}-win32-${apppj.config.archWin}`, `${apppj.productName}.exe`) + "\"";
    console.log("///// Running current win32-%s release of %s...", apppj.config.archWin, apppj.productName);
    proc.spawn(executable, [], { detached: true, shell: true });
    process.exit(0);
}