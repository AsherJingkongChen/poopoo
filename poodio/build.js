#! /usr/bin/env node

process.chdir(__dirname);

globalThis.fs = require("node:fs");

// Parse the arguments
const args = require("minimist")(process.argv.slice(2));
const cargoTarget = ["common", "false", true].includes(args.target) ? "" : args.target;
const featuresArg = args.features ? `--features ${args.features} ` : "";
const targetArg = cargoTarget ? `--target ${cargoTarget} ` : "";
const releaseArg = cargoTarget ? "--release " : "";
const { name: pkgName } = require("smol-toml").parse(
    fs.readFileSync("Cargo.toml", "utf8"),
).package;
const npmTarget = {
    "aarch64-apple-darwin": { cpu: ["arm64"], os: ["darwin"] },
    "aarch64-unknown-linux-gnu": { cpu: ["arm64"], os: ["linux"], libc: ["glibc"] },
    "aarch64-pc-windows-msvc": { cpu: ["arm64"], os: ["win32"] },
    "i686-pc-windows-msvc": { cpu: ["ia32"], os: ["win32"] },
    "i686-unknown-linux-gnu": { cpu: ["ia32"], os: ["linux"], libc: ["glibc"] },
    "x86_64-apple-darwin": { cpu: ["x64"], os: ["darwin"] },
    "x86_64-unknown-linux-gnu": { cpu: ["x64"], os: ["linux"], libc: ["glibc"] },
    "x86_64-pc-windows-msvc": { cpu: ["x64"], os: ["win32"] },
}[cargoTarget];
if (cargoTarget && !npmTarget) {
    throw new TypeError(`No available Npm target for Cargo target '${cargoTarget}'`);
}
const binName = cargoTarget && `${pkgName}${npmTarget.os[0] === "win32" ? ".exe" : ""}`;

// Clean the artifacts
fs.rmSync("dist/", { force: true, recursive: true });

// Build the artifacts
if (!fs.existsSync("package.json")) {
    fs.writeFileSync("package.json", "{}");
}
require("node:child_process").execSync(
    `\
npx napi build --cargo-flags=--locked --no-dts-header \
${featuresArg}${targetArg}${releaseArg}dist/npm/src/node/`,
    { stdio: "inherit", windowsHide: true },
);

// Write the artifacts
const npmPkg = { ...require("./package.json") };
if (cargoTarget) {
    const binPath = `../target/${cargoTarget}/release/${binName}`;
    fs.mkdirSync("dist/bin", { recursive: true });
    fs.copyFileSync(binPath, `dist/bin/${binName}`);
    fs.copyFileSync(binPath, `dist/npm/src/node/${binName}`);
    fs.writeFileSync(
        `dist/npm/${npmPkg.main}`,
        'module.exports = require("./index.node");\n',
    );
} else {
    fs.copyFileSync("src/node/loader.cjs", "dist/npm/src/node/loader.cjs");
    fs.copyFileSync(npmPkg.bin, `dist/npm/${npmPkg.bin}`);
    fs.copyFileSync(npmPkg.main, `dist/npm/${npmPkg.main}`);
    fs.unlinkSync("dist/npm/src/node/index.node");
}

// Write the common files
const npmPkgUpdated = (function () {
    let npmPkgChange = { scripts: undefined };
    if (cargoTarget) {
        const { cpu, os, libc } = npmTarget;
        const binUpdated = `src/node/${binName}`;
        const pkgNameUpdated = require("./src/node/loader.cjs").formatPkgName({
            name: pkgName,
            cpu: cpu[0],
            os: os[0],
            libc: libc?.[0],
        });
        npmPkgChange = Object.assign(
            npmPkgChange,
            { bin: binUpdated, name: pkgNameUpdated, optionalDependencies: undefined },
            npmTarget,
        );
    }
    return Object.fromEntries(Object.entries(Object.assign(npmPkg, npmPkgChange)).sort());
})();
fs.writeFileSync("dist/npm/package.json", JSON.stringify(npmPkgUpdated, null, 4) + "\n");
fs.copyFileSync("README.md", "dist/npm/README.md");
fs.copyFileSync("LICENSE.txt", "dist/npm/LICENSE.txt");
