#! /usr/bin/env node

process.chdir(__dirname);

// Import the modules
globalThis.execSync = require("node:child_process").execSync;
globalThis.FS = require("node:fs");
globalThis.parseArgs = require("minimist");
globalThis.parseToml = require("smol-toml").parse;

// Resolve the paths
const CPAR = require.resolve("cargo-cp-artifact/bin/cargo-cp-artifact");
const NAPI = require.resolve("@napi-rs/cli/scripts");
const TDIR = "dist/npm/";
const SDIR = "src/node/";

// Fetch the arguments
const { features, target } = parseArgs(process.argv.slice(2));
const featuresArg = features ? `--features ${features} ` : "";
const targetArg = target ? `--target ${target} ` : "";
const { name } = parseToml(FS.readFileSync("Cargo.toml", "utf8")).package;

// Build the artifacts
FS.rmSync(TDIR, { force: true, recursive: true });
execSync(
    `\
${CPAR} --artifact bin ${name} ${TDIR}${SDIR}${name} \
-- ${NAPI} build --no-dts-header --cargo-flags='--locked --message-format json' \
${featuresArg}${targetArg}${targetArg && "--release "}${TDIR}${SDIR}`,
    { stdio: "inherit" },
);
FS.writeFileSync(
    `${TDIR}${SDIR}index.cjs`,
    `module.exports = require("./index.node");\n`,
);

// Replace artifacts with placeholders
if (!target) {
    FS.copyFileSync(`${SDIR}index.cjs`, `${TDIR}${SDIR}index.cjs`);
    FS.copyFileSync(`${SDIR}index.node`, `${TDIR}${SDIR}index.node`);
    FS.copyFileSync(`${SDIR}loader.cjs`, `${TDIR}${SDIR}loader.cjs`);
    FS.copyFileSync(`${SDIR}${name}`, `${TDIR}${SDIR}${name}`);
}

// Update the package info
let npmPkgChange = {
    scripts: undefined,
};
if (target) {
    const npmTarget = buildNpmPkgTargetFromCargo(target);
    const { cpu, os, libc } = npmTarget;
    const npmTargetTriple = `${cpu[0]}-${os[0]}-${libc?.[0] || "unknown"}`;
    npmPkgChange = {
        ...npmPkgChange,
        name: `@${name}/${name}-${npmTargetTriple}`,
        optionalDependencies: undefined,
        ...npmTarget,
    };
}
const npmPkg = Object.fromEntries(
    Object.entries(Object.assign(require("./package.json"), npmPkgChange)).sort(),
);

// Write the common files
FS.writeFileSync(`${TDIR}package.json`, JSON.stringify(npmPkg, null, 2) + "\n");
FS.copyFileSync("README.md", `${TDIR}README.md`);
FS.copyFileSync("LICENSE.txt", `${TDIR}LICENSE.txt`);

function buildNpmPkgTargetFromCargo(cargoTarget) {
    const transform = {
        "aarch64-apple-darwin": { cpu: ["arm64"], os: ["darwin"] },
        "aarch64-unknown-linux-gnu": {
            cpu: ["arm64"],
            os: ["linux"],
            libc: ["glibc"],
        },
        "aarch64-pc-windows-msvc": { cpu: ["arm64"], os: ["win32"] },
        "i686-pc-windows-msvc": { cpu: ["ia32"], os: ["win32"] },
        "i686-unknown-linux-gnu": {
            cpu: ["ia32"],
            os: ["linux"],
            libc: ["glibc"],
        },
        "x86_64-apple-darwin": { cpu: ["x64"], os: ["darwin"] },
        "x86_64-pc-windows-msvc": { cpu: ["x64"], os: ["win32"] },
        "x86_64-unknown-linux-gnu": {
            cpu: ["x64"],
            os: ["linux"],
            libc: ["glibc"],
        },
    };
    const npmTarget = transform[cargoTarget];
    if (!npmTarget) {
        throw new TypeError(`Unsupported target: "${cargoTarget}"`);
    }
    return npmTarget;
}
