const L = require("./loader.cjs");
const { name } = require("../../package.json");

const pkgName = L.buildPkgName(name);
const source = require.resolve(pkgName);
module.exports = require(pkgName);
L.copyPkgSrc(source);
