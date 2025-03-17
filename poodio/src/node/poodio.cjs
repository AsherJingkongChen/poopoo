#! /usr/bin/env node

const { bin, name } = require("../../package.json");
require("node:child_process").execFileSync(
    require.resolve(`${require("./loader.cjs").pkgName(name)}/${bin}`),
    process.argv.slice(2),
    { stdio: "inherit", windowsHide: true },
);
