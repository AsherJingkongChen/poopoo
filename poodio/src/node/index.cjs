const loader = require("./loader.cjs");
const { name, version } = require("../../package.json");

const nameForPlatform = loader.buildPkgNameForPlatform(name);
loader.tryInstallPkg(nameForPlatform, version);

module.exports = require(nameForPlatform);
