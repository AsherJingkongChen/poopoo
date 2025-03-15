const loader = require("./loader.cjs");
const { name, version } = require("../../package.json");

const pkgName = loader.buildPkgName(name);
loader.tryInstallPkg(pkgName, version);

const source = require.resolve(pkgName);
loader.copyPkg(source);

module.exports = require(pkgName);
