const loader = require("./loader.cjs");
const { name, version } = require("../../package.json");

const pkgName = loader.buildPkgName(name);
loader.tryInstallPkg(pkgName, version);

const source = require.resolve(pkgName);
module.exports = require(pkgName);

// TODO: Replace stubs with the "source" package
