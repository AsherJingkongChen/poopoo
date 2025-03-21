#! /usr/bin/env node

process.chdir(__dirname);

globalThis.execSync = require("node:child_process").execSync;
globalThis.fs = require("node:fs");
globalThis.parseArgs = require("minimist");
globalThis.parseToml = require("smol-toml").parse;

// Parse the arguments
const { features, target: cargoTarget } = parseArgs(process.argv.slice(2));
const npmTarget = (() => {
    require("./src/node/loader.cjs");
    const toNpm = {
        "aarch64-apple-darwin": { cpu: ["arm64"], os: ["darwin"] },
        "aarch64-unknown-linux-gnu": { cpu: ["arm64"], os: ["linux"], libc: ["glibc"] },
        "aarch64-pc-windows-msvc": { cpu: ["arm64"], os: ["win32"] },
        "i686-pc-windows-msvc": { cpu: ["ia32"], os: ["win32"] },
        "i686-unknown-linux-gnu": { cpu: ["ia32"], os: ["linux"], libc: ["glibc"] },
        "x86_64-apple-darwin": { cpu: ["x64"], os: ["darwin"] },
        "x86_64-unknown-linux-gnu": { cpu: ["x64"], os: ["linux"], libc: ["glibc"] },
    };
    return (
        toNpm[cargoTarget] || {
            cpu: [process.arch],
            os: [process.platform],
            libc: process.libc && [process.libc],
        }
    );
})();
const { name: pkgName } = parseToml(fs.readFileSync("Cargo.toml", "utf8")).package;
const binName = `${pkgName}${npmTarget.os[0] === "win32" ? ".exe" : ""}`;

// Build the artifacts
fs.rmSync("dist/", { force: true, recursive: true });
const napiCliPath = require.resolve("@napi-rs/cli/scripts");
const featuresArg = features ? `--features '${features}' ` : "";
const targetArg = cargoTarget ? `--target '${cargoTarget}' ` : "";
const releaseFlag = cargoTarget ? "--release" : "";
execSync(
    `\
node '${napiCliPath}' build --cargo-flags=--locked --no-dts-header \
${featuresArg}${targetArg}${releaseFlag} dist/npm/src/node/`,
    { stdio: "inherit", windowsHide: true },
);

// Copy the artifacts
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
    let npmPkgDelta = { scripts: undefined };
    if (cargoTarget) {
        const { cpu, os, libc } = npmTarget;
        const binUpdated = `src/node/${binName}`;
        const pkgNameUpdated = `@${pkgName}/${pkgName}-${cpu[0]}-${os[0]}-${libc?.[0] || "unknown"}`;
        npmPkgDelta = Object.assign(
            npmPkgDelta,
            { bin: binUpdated, name: pkgNameUpdated, optionalDependencies: undefined },
            npmTarget,
        );
    }
    return Object.fromEntries(Object.entries(Object.assign(npmPkg, npmPkgDelta)).sort());
})();
fs.writeFileSync("dist/npm/package.json", JSON.stringify(npmPkgUpdated, null, 4) + "\n");
fs.copyFileSync("README.md", "dist/npm/README.md");
fs.copyFileSync("LICENSE.txt", "dist/npm/LICENSE.txt");
