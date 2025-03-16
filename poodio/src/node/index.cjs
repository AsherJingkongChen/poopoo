const loader = require("./loader.cjs");
const { name, version } = require("../../package.json");

const pkgName = loader.buildPkgName(name);
const source = require.resolve(pkgName);

module.exports = require(pkgName);

loader.copyPkgSrc(source);
