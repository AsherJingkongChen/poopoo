#! /usr/bin/env node

const pkgName = require("./loader.cjs").buildPkgName(require("../../package.json").name);
require("node:child_process").execFileSync(
    require.resolve(`${pkgName}/${require(`${pkgName}/package.json`).bin}`),
    process.argv.slice(2),
    { stdio: "inherit", windowsHide: true },
);
