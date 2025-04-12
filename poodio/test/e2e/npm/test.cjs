#! /usr/bin/env node

process.chdir(__dirname);

const { test } = require("uvu");
const assert = require("uvu/assert");

test.before(() => {
    require("node:child_process").execSync("npm i -s --no-save ../../../dist/npm/", {
        stdio: "inherit",
        windowsHide: true,
    });
});

test("Package can be required", () => require("poodio"));

test("Package executable version is correct", () => {
    const output = require("node:child_process")
        .execSync("npx -y poodio --version", {
            encoding: "utf8",
            windowsHide: true,
        })
        .slice(0, -1);
    assert.is(output, answerVersion());
});

test("'version()' is correct", () => {
    const output = require("poodio").version();
    assert.is(output, answerVersion());
});

function answerVersion() {
    return `poodio@${require(`poodio/package.json`).version}`;
}

test.run();
