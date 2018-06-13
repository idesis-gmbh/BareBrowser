// Run a Node module command from either ./buid/tmp/node_modules/.bin or /node_modules/.bin with params, and (optionally)
// only if a file/path exists. If the command in ./build/tmp exists, it is prefered. If -f <filename/path> is given, the
// command will only be run, if this file/path exists otherwise the process gracefully exits with 0.
const proc = require("child_process");
const path = require("path");
const fse = require("fs-extra");

function getCmd(cmdName) {
    let exectuable = path.join(__dirname, "tmp", "node_modules", ".bin",
        (process.platform === "win32") ? `${cmdName}.cmd` : cmdName);
    if (fse.existsSync(exectuable)) {
        return exectuable;
    }
    exectuable = path.join(__dirname, "..", "node_modules", ".bin",
        (process.platform === "win32") ? `${cmdName}.cmd` : cmdName);
    return fse.existsSync(exectuable) ? exectuable : null;
}

let index = 2;
if (process.argv[index] === "-f") {
    if (!fse.existsSync(process.argv[++index])) {
        process.exit(0);
    }
    ++index;
}

const cmd = getCmd(process.argv[index]);
if (!cmd) {
    console.error("Command not found:", cmd);
    process.exit(1);
}

process.exit(proc.spawnSync(cmd, process.argv.splice(++index), { shell: true, stdio: "inherit" }).status);
