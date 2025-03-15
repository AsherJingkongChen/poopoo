const loader = require("./loader.cjs");
const { name, version } = require("../../package.json");

const pkgName = loader.buildPkgName(name);
loader.tryInstallPkg(pkgName, version);

module.exports = require(pkgName);
