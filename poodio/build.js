#! /usr/bin/env node

// Import the modules
globalThis.execSync = require("node:child_process").execSync;
globalThis.fs = require("node:fs");
globalThis.parseArgs = require("minimist");
globalThis.parseToml = require("smol-toml").parse;
globalThis.path = require("node:path");

// Resolve the paths
process.chdir(__dirname);
const CPAR = require.resolve("cargo-cp-artifact/bin/cargo-cp-artifact");
const NAPI = require.resolve("@napi-rs/cli/scripts");
const TDIR = "dist/npm/";
const SDIR = "src/node/";

// Fetch the arguments
const { features, target } = parseArgs(process.argv.slice(2));
const featuresArg = features ? `--features ${features} ` : "";
const targetArg = target ? `--target ${target} ` : "";
const { name } = parseToml(fs.readFileSync("Cargo.toml", "utf8")).package;

// Build the artifacts
execSync(
    `\
${CPAR} --artifact bin ${name} ${TDIR}${SDIR}${name} \
-- ${NAPI} build --no-dts-header --cargo-flags='--locked --message-format json' \
${featuresArg}${targetArg}${targetArg && "--release "}${TDIR}${SDIR}`,
    { stdio: "inherit", windowsHide: true }
);
fs.writeFileSync(`${TDIR}${SDIR}index.js`, `module.exports = require("./index.node");\n`);

// Replace artifacts with placeholders
if (!target) {
    fs.cpSync(`${SDIR}index.js`, `${TDIR}${SDIR}index.js`);
    fs.cpSync(`${SDIR}index.node`, `${TDIR}${SDIR}index.node`);
    fs.cpSync(`${SDIR}poodio`, `${TDIR}${SDIR}poodio`);
}

// Update the package info
let npmPkgChange = {
    scripts: undefined,
};
if (target) {
    const npmTarget = cargoToNpmTarget(target);
    const npmTargetTriple =
        npmTarget.cpu[0] + "-" + npmTarget.os[0] + "-" + (npmTarget.libc[0] || "unknown");
    npmPkgChange = {
        name: `@${name}/${npmTargetTriple}`,
        optionalDependencies: undefined,
        ...npmPkgChange,
        ...npmTarget,
    };
}
const npmPkg = Object.fromEntries(
    Object.entries({
        ...require("./package.json"),
        ...npmPkgChange,
    }).sort()
);

// Write the common files
fs.writeFileSync(`${TDIR}package.json`, JSON.stringify(npmPkg, null, 2));
fs.cpSync("README.md", `${TDIR}README.md`);
fs.cpSync("LICENSE.txt", `${TDIR}LICENSE.txt`, { dereference: true });

function cargoToNpmTarget(cargoTarget) {
    const transform = {
        "aarch64-apple-darwin": { os: ["darwin"], cpu: ["arm64"], libc: [] },
        "aarch64-unknown-linux-gnu": { os: ["linux"], cpu: ["arm64"], libc: ["glibc"] },
        "aarch64-pc-windows-msvc": { os: ["win32"], cpu: ["arm64"], libc: [] },
        "i686-pc-windows-msvc": { os: ["win32"], cpu: ["ia32"], libc: [] },
        "i686-unknown-linux-gnu": { os: ["linux"], cpu: ["ia32"], libc: ["glibc"] },
        "x86_64-apple-darwin": { os: ["darwin"], cpu: ["x64"], libc: [] },
        "x86_64-pc-windows-msvc": { os: ["win32"], cpu: ["x64"], libc: [] },
        "x86_64-unknown-linux-gnu": { os: ["linux"], cpu: ["x64"], libc: ["glibc"] },
    };
    const npmTarget = transform[cargoTarget];
    if (!npmTarget) {
        throw new TypeError(`Unsupported target: "${cargoTarget}"`);
    }
    return npmTarget;
}
