#! /usr/bin/env node

process.chdir(__dirname);

const { test } = require("uvu");
const assert = require("uvu/assert");

const PKG_PATH = "../../../dist/npm";

test("Package modules can be required or resolved", () => {
    assert.not.throws(() => require(PKG_PATH), `No module: '${PKG_PATH}'`);
    assert.not.throws(() => require(`${PKG_PATH}/src/node/index.cjs`), "No main module");
    assert.not.throws(() => require(`${PKG_PATH}/package.json`), "No package manifest");
});

test("Package executable version is correct", () => {
    const output = require("node:child_process")
        .execFileSync(
            require.resolve(`${PKG_PATH}/${require(`${PKG_PATH}/package.json`).bin}`),
            ["--version"],
            { encoding: "utf8", windowsHide: true },
        )
        .trimEnd();
    assert.is(output, answerVersion());
});

test("Function 'version()' is correct", () => {
    const output = require(PKG_PATH).version();
    assert.is(output, answerVersion());
});

function answerVersion() {
    return `poodio@${require(`${PKG_PATH}/package.json`).version}`;
}

test.run();
