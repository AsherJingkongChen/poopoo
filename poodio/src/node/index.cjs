const pkgName = require("./loader.cjs").buildPkgName(require("../../package.json").name);
module.exports = require(pkgName);
