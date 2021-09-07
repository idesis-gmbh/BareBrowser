// Delete the specified release build from the release-directory (./release/)
const fse = require("fs-extra");
const path = require("path");
const apppj = fse.readJsonSync(process.argv[2]);
const arch = process.argv[3];
const stub = `${apppj.productName}-${apppj.version}-${arch}-`;

fse.removeSync(path.join(process.argv[4], stub + "x64"));
fse.removeSync(path.join(process.argv[4], stub + "arm64"));

if (arch === "darwin") {
    //
} else if (arch === "linux") {
    fse.removeSync(path.join(process.argv[4], stub + "armv7l"));
    fse.removeSync(path.join(process.argv[4], stub + "mips64el"));
} else if (arch === "win32") {
    fse.removeSync(path.join(process.argv[4], stub + "ia32"));
} else {
    console.error("%s: Unknown platform: %s", process.argv[1], arch);
    process.exit(1);
}
