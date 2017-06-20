// Run a Node module command from ./buid/tmp/node_modules/.bin with params
const proc = require("child_process");
const path = require("path");
proc.spawnSync(
    path.join(__dirname, "tmp", "node_modules", ".bin", (process.platform == "win32") ? `${process.argv[2]}.cmd` : process.argv[2]),
    process.argv.splice(3),
    { shell: true, stdio: "inherit" }
);
