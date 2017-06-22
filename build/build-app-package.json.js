// Remove dependencies, devDependencies and config sections from package.json in out-directory (./out/)
const fse = require("fs-extra");
const apppj = fse.readJsonSync(process.argv[2]); 
delete apppj.dependencies;
delete apppj.devDependencies;
delete apppj.config;
fse.writeJsonSync(process.argv[2], apppj, { spaces: 2 });
