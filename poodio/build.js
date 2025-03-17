#! /usr/bin/env node

process.chdir(__dirname);

// Import the modules
globalThis.execSync = require("node:child_process").execSync;
globalThis.F = require("node:fs");
globalThis.parseArgs = require("minimist");
globalThis.parseToml = require("smol-toml").parse;

// Resolve the executable paths
const CPAR = require.resolve("cargo-cp-artifact/bin/cargo-cp-artifact");
const NAPI = require.resolve("@napi-rs/cli/scripts");

// Fetch the arguments
const { features, target } = parseArgs(process.argv.slice(2));
const FEATURES = features ? `--features ${features} ` : "";
const TARGET = target ? `--target ${target} ` : "";
const { name } = parseToml(F.readFileSync("Cargo.toml", "utf8")).package;

// Clean the previous artifacts
F.rmSync("dist/", { force: true, recursive: true });

// Build the artifacts
// TODO: .exe
execSync(
    `\
${CPAR} --artifact bin ${name} dist/bin/${name} -- \
${NAPI} build --no-dts-header --cargo-flags='--locked --message-format json' \
${FEATURES}${TARGET}${TARGET && "--release "}dist/npm/src/node/`,
    { stdio: "inherit" },
);

// Write stubs if the target is not specified
// TODO: .exe
if (!target) {
    F.copyFileSync("src/node/index.cjs", "dist/npm/src/node/index.cjs");
    F.copyFileSync("src/node/loader.cjs", "dist/npm/src/node/loader.cjs");
    F.copyFileSync(`src/node/${name}`, `dist/npm/src/node/${name}`);
    F.rmSync("dist/npm/src/node/index.node");
} else {
    F.writeFileSync(
        "dist/npm/src/node/index.cjs",
        'module.exports = require("./index.node");\n',
    );
    F.copyFileSync(`dist/bin/${name}`, `dist/npm/src/node/${name}`);
}

// Update the package info
let npmPkgChange = {
    scripts: undefined,
};
if (target) {
    const npmTarget = buildNpmPkgTargetFromCargo(target);
    const { cpu, os, libc } = npmTarget;
    npmPkgChange = {
        ...npmPkgChange,
        name: `@${name}/${name}-${cpu}-${os}-${libc || "unknown"}`,
        optionalDependencies: undefined,
        ...npmTarget,
    };
}
const npmPkg = Object.fromEntries(
    Object.entries(Object.assign(require("./package.json"), npmPkgChange)).sort(),
);

// Write the common files
F.writeFileSync("dist/npm/package.json", JSON.stringify(npmPkg, null, 4) + "\n");
F.copyFileSync("README.md", `dist/npm/README.md`);
F.copyFileSync("LICENSE.txt", `dist/npm/LICENSE.txt`);

function buildNpmPkgTargetFromCargo(cargoTarget) {
    const npmTarget = {
        "aarch64-apple-darwin": { cpu: "arm64", os: "darwin" },
        "aarch64-unknown-linux-gnu": { cpu: "arm64", os: "linux", libc: "glibc" },
        "aarch64-pc-windows-msvc": { cpu: "arm64", os: "win32" },
        "i686-pc-windows-msvc": { cpu: "ia32", os: "win32" },
        "i686-unknown-linux-gnu": { cpu: "ia32", os: "linux", libc: "glibc" },
        "x86_64-apple-darwin": { cpu: "x64", os: "darwin" },
        "x86_64-pc-windows-msvc": { cpu: "x64", os: "win32" },
        "x86_64-unknown-linux-gnu": { cpu: "x64", os: "linux", libc: "glibc" },
    }[cargoTarget];
    if (!npmTarget) {
        throw new TypeError(`Unsupported target: "${cargoTarget}"`);
    }
    return npmTarget;
}
