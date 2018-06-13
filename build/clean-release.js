// Delete the specified release build from the release-directory (./release/)
const fse = require("fs-extra");
const path = require("path");
const apppj = fse.readJsonSync(process.argv[2]);
if (process.argv[3] === "darwin") {
    fse.removeSync(path.join(process.argv[4], apppj.productName + "-darwin-x64"));
} else if (process.argv[3] === "win32") {
    fse.removeSync(path.join(process.argv[4], apppj.productName + "-win32-x64"));
    fse.removeSync(path.join(process.argv[4], apppj.productName + "-win32-ia32"));
} else {
    console.error("%s: Unknown platform: %s", process.argv[1], process.argv[3]);
    process.exit(1);
}
