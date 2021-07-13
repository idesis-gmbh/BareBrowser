// Clear out-directory (./out/), retaining bin, lib, node_modules, res, style and package.json (given via command line)
const fse = require("fs-extra");
const path = require("path");
const preserve = process.argv.splice(3);
if (fse.existsSync(process.argv[2])) {
    fse.readdirSync(process.argv[2]).forEach((entry) => {
        if (!preserve.includes(entry)) {
            fse.removeSync(path.join(process.argv[2], entry));
        }
    });
}
