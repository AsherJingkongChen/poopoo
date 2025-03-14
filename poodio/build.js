#! /usr/bin/env node

// Import the modules
globalThis.fs = require("fs");
globalThis.path = require("path");
globalThis.parseToml = require("smol-toml").parse;
globalThis.parseArgs = require("minimist");
globalThis.execSync = require("node:child_process").execSync;

// Resolve the paths
process.chdir(__dirname);
const CPAR = require.resolve("cargo-cp-artifact/bin/cargo-cp-artifact");
const NAPI = require.resolve("@napi-rs/cli/scripts");
const DIR = "dist/npm/";

// Fetch the arguments
const { features, target } = parseArgs(process.argv.slice(2));
if (!target) {
    throw new TypeError("Missing argument: --target <platform>");
}
const featuresArg = features ? `--features ${features} ` : "";
const targetArg = `--target ${target} `;
const { name } = parseToml(fs.readFileSync("Cargo.toml", "utf8")).package;

// Build the artifacts
execSync(
    `\
${CPAR} --artifact bin ${name} ${DIR}src/node/${name} \
-- ${NAPI} build ${targetArg}${featuresArg}--no-dts-header --release \
--cargo-flags='--locked --message-format json' ${DIR}src/node/`,
    { stdio: "inherit", windowsHide: true }
);

// Rewrite the package.json
const npmPkg = Object.assign(require("./package.json"), {
    name: `@${name}/${name}-${target}`,
    optionalDependencies: undefined,
    scripts: undefined,
});
fs.writeFileSync(`${DIR}package.json`, JSON.stringify(npmPkg, null, 2));

// Copy the README and LICENSE files
fs.cpSync("README.md", `${DIR}README.md`);
fs.cpSync("LICENSE.txt", `${DIR}LICENSE.txt`, { dereference: true });
