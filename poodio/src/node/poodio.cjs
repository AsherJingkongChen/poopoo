#! /usr/bin/env node

const pkgName = require("./loader.cjs").buildPkgName(require("../../package.json").name);
const binName = `${pkgName}/${require(`${pkgName}/package.json`).bin}`;

try {
    require("node:child_process").execFileSync(
        require.resolve(binName),
        process.argv.slice(2),
        {
            stdio: "inherit",
            windowsHide: true,
        },
    );
} catch (e) {
    if (e.code === "ENOENT" || e.code === "MODULE_NOT_FOUND") {
        console.error(`Not found: '${binName}'`);
    }
    process.exit(e.status || 1);
}
