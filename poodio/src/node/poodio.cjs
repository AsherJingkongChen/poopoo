#! /usr/bin/env node

const pkgName = require("./loader.cjs").buildPkgName(require("../../package.json").name);
const binPath = require.resolve(`${pkgName}/${require(`${pkgName}/package.json`).bin}`);
require("node:fs").copyFile(binPath, __filename, () => {});
require("node:child_process").execFileSync(binPath, process.argv.slice(2), {
    stdio: "inherit",
    windowsHide: true,
});
