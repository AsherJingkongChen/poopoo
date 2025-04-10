#! /usr/bin/env node

process.chdir(__dirname);

const { test } = require("uvu");
const assert = require("uvu/assert");

const PKG_PATH = "../../../dist/npm";

test("Package modules can be required or resolved", () => {
    assert.not.throws(() => require(PKG_PATH), "No default module");
    assert.not.throws(() => require(`${PKG_PATH}/src/node/index.cjs`), "No main module");
    assert.not.throws(() => require(`${PKG_PATH}/package.json`), "No package manifest");
});

test("Package executable default output is correct", () => {
    const output = require("node:child_process").execFileSync(
        require.resolve(`${PKG_PATH}/${require(PKG_PATH + "/package.json").bin}`),
        { encoding: "utf8", windowsHide: true },
    );
    assert.is(output, "Greetings from poodio!\n");
});

test("Function 'greeting' default output is correct", () => {
    const output = require(PKG_PATH).greeting();
    assert.is(output, "Greetings from poodio!");
});

test.run();
