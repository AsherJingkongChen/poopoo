#! /usr/bin/env node

process.chdir(__dirname);

const { test } = require("uvu");
const assert = require("uvu/assert");

const PKG_PATH = "../../../dist/npm";

test.before(() => {
    require("node:child_process").execSync(`npm i -s --no-save ${PKG_PATH}`, {
        stdio: "inherit",
        windowsHide: true,
    });
});

test("Package modules can be required or resolved", () => {
    assert.not.throws(() => require(PKG_PATH), `No module: '${PKG_PATH}'`);
    assert.not.throws(() => require(`${PKG_PATH}/src/node/index.node`), "No main module");
    assert.not.throws(() => require(`${PKG_PATH}/package.json`), "No package manifest");
});

test("Package executable version is correct", () => {
    const output = require("node:child_process")
        .execSync("npx -y ../../../ --version", {
            encoding: "utf8",
            windowsHide: true,
        })
        .slice(0, -1);
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
