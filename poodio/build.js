#! /usr/bin/env node

process.chdir(__dirname);

globalThis.fs = require("node:fs");

const CARGO_TO_NPM_TARGET = {
    "aarch64-apple-darwin": { cpu: ["arm64"], os: ["darwin"] },
    "aarch64-unknown-linux-gnu": { cpu: ["arm64"], os: ["linux"], libc: ["glibc"] },
    // "aarch64-unknown-linux-musl": { cpu: ["arm64"], os: ["linux"], libc: ["musl"] },
    "aarch64-pc-windows-msvc": { cpu: ["arm64"], os: ["win32"] },
    "i686-pc-windows-msvc": { cpu: ["ia32"], os: ["win32"] },
    "i686-unknown-linux-gnu": { cpu: ["ia32"], os: ["linux"], libc: ["glibc"] },
    "x86_64-apple-darwin": { cpu: ["x64"], os: ["darwin"] },
    "x86_64-unknown-linux-gnu": { cpu: ["x64"], os: ["linux"], libc: ["glibc"] },
    // "x86_64-unknown-linux-musl": { cpu: ["x64"], os: ["linux"], libc: ["musl"] },
    "x86_64-pc-windows-msvc": { cpu: ["x64"], os: ["win32"] },
};

// Parse the arguments
const args = require("minimist")(process.argv.slice(2));
const cargoTarget = ["common", "false", true].includes(args.target) ? "" : args.target;
const { name } = require("smol-toml").parse(
    fs.readFileSync("Cargo.toml", "utf8"),
).package;
const npmTarget = CARGO_TO_NPM_TARGET[cargoTarget];
if (cargoTarget && !npmTarget) {
    throw new TypeError(`Invalid cargo target: '${cargoTarget}'`);
}

// Clean the artifacts
fs.rmSync("dist/", { force: true, recursive: true });

// Build the artifacts
if (!fs.existsSync("package.json")) {
    fs.writeFileSync("package.json", "{}");
}
const buildArgs = "npx napi build --cargo-flags=--locked --no-dts-header".split(" ");
args.features && buildArgs.push(`--features ${args.features}`);
cargoTarget && buildArgs.push("--release", `--target=${cargoTarget}`);
buildArgs.push("dist/npm/src/node/");
require("node:child_process").execSync(buildArgs.join(" "), {
    stdio: "inherit",
    windowsHide: true,
});

// Write the artifacts
const npmPkg = { ...require("./package.json") };
if (cargoTarget) {
    const binName = `${name}${npmTarget.os[0] === "win32" ? ".exe" : ""}`;
    const binPath = `../target/${cargoTarget}/release/${binName}`;
    fs.mkdirSync("dist/bin", { recursive: true });
    fs.copyFileSync(binPath, `dist/bin/${binName}`);
} else {
    fs.copyFileSync(npmPkg.main, `dist/npm/${npmPkg.main}`);
    fs.unlinkSync("dist/npm/src/node/index.node");
}

// Write the common files
if (cargoTarget) {
    const { cpu, os, libc } = npmTarget;
    Object.assign(npmPkg, npmTarget, {
        bin: undefined,
        main: "src/node/index.node",
        name: formatOdName(name, cpu[0], os[0], libc?.[0]),
    });
} else {
    Object.assign(npmPkg, {
        optionalDependencies: Object.fromEntries(
            Object.values(CARGO_TO_NPM_TARGET).map((t) => [
                formatOdName(name, t.cpu[0], t.os[0], t.libc?.[0]),
                npmPkg.version,
            ]),
        ),
    });
}
fs.writeFileSync(
    "dist/npm/package.json",
    JSON.stringify(Object.fromEntries(Object.entries(npmPkg).sort()), null, 4) + "\n",
);
fs.copyFileSync("README.md", "dist/npm/README.md");
fs.copyFileSync("LICENSE.txt", "dist/npm/LICENSE.txt");

console.log("Built artifacts:");
fs.readdirSync("dist", { recursive: true, withFileTypes: true }).forEach((entry) => {
    if (entry.isDirectory()) return;
    const prefix = entry.parentPath;
    const suffix = entry.isDirectory() ? "/" : "";
    const path = `${prefix}/${entry.name}${suffix}`.replaceAll("\\", "/");
    console.log("-", path);
});

// Utilities
function formatOdName(name, cpu, os, libc) {
    return `@${name}/${name}-${cpu}-${os}-${libc || "unknown"}`;
}
