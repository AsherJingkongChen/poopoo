#! /usr/bin/env node

process.chdir(__dirname);

// Import the modules
globalThis.execSync = require("node:child_process").execSync;
globalThis.F = require("node:fs");
globalThis.parseArgs = require("minimist");
globalThis.parseToml = require("smol-toml").parse;

// Fetch the arguments
const { features, target } = parseArgs(process.argv.slice(2));
const { name } = parseToml(F.readFileSync("Cargo.toml", "utf8")).package;
const npmTarget = buildNpmTargetFromCargo(target);
const binExt = npmTarget.os[0] === "win32" ? ".exe" : "";

// Clean the previous artifacts
F.rmSync("dist/", { force: true, recursive: true });

// Build the artifacts
const execBuild = (isBin) => {
    const NAPI = require.resolve("@napi-rs/cli/scripts");
    const FEATURES = features ? `--features '${features}' ` : "";
    const TARGET = target ? `--target '${target}' ` : "";
    execSync(
        `\
node '${NAPI}' build --cargo-flags=--locked --no-dts-header \
${FEATURES}${TARGET}${TARGET && "--release "}${isBin && `--bin '${name}' `} \
dist/${isBin ? "bin/" : "npm/src/node/"}`,
        { stdio: "inherit", windowsHide: true },
    );
};
execBuild("");
execBuild("T");

const { bin, main, ...npmPkg } = { ...require("./package.json") };

// Write the artifacts
if (!target) {
    F.copyFileSync("src/node/loader.cjs", "dist/npm/src/node/loader.cjs"); // TODO: remove
    F.copyFileSync(bin, `dist/npm/${bin}`);
    F.copyFileSync(main, `dist/npm/${main}`);
    F.rmSync("dist/npm/src/node/index.node");
} else {
    F.copyFileSync(`dist/bin/${name}${binExt}`, `dist/npm/src/node/${name}${binExt}`);
    F.writeFileSync(`dist/npm/${main}`, 'module.exports = require("./index.node");\n');
}

// Update the package info
let npmPkgDelta = {
    scripts: undefined,
};
if (target) {
    const npmTarget = buildNpmTargetFromCargo(target);
    const { cpu, os, libc } = npmTarget;
    const binUpdated = `src/node/${name}${binExt}`;
    const nameUpdated = `@${name}/${name}-${cpu[0]}-${os[0]}-${libc?.[0] || "unknown"}`;
    npmPkgDelta = {
        ...npmPkgDelta,
        bin: binUpdated,
        name: nameUpdated,
        optionalDependencies: undefined,
        ...npmTarget,
    };
}
const npmPkgUpdated = Object.fromEntries(
    Object.entries({ ...npmPkg, bin, main, ...npmPkgDelta }).sort(),
);

// Write the common files
F.writeFileSync("dist/npm/package.json", JSON.stringify(npmPkgUpdated, null, 4) + "\n");
F.copyFileSync("README.md", `dist/npm/README.md`);
F.copyFileSync("LICENSE.txt", `dist/npm/LICENSE.txt`);

function buildNpmTargetFromCargo(cargoTarget) {
    const npmTarget = {
        "aarch64-apple-darwin": { cpu: ["arm64"], os: ["darwin"] },
        "aarch64-unknown-linux-gnu": { cpu: ["arm64"], os: ["linux"], libc: ["glibc"] },
        "aarch64-pc-windows-msvc": { cpu: ["arm64"], os: ["win32"] },
        "i686-pc-windows-msvc": { cpu: ["ia32"], os: ["win32"] },
        "i686-unknown-linux-gnu": { cpu: ["ia32"], os: ["linux"], libc: ["glibc"] },
        "x86_64-apple-darwin": { cpu: ["x64"], os: ["darwin"] },
        "x86_64-unknown-linux-gnu": { cpu: ["x64"], os: ["linux"], libc: ["glibc"] },
    }[cargoTarget];
    return (
        npmTarget || {
            cpu: [process.arch],
            os: [process.platform],
            libc: process.libc && [process.libc],
        }
    );
}
