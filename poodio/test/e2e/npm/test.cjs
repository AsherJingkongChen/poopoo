#! /usr/bin/env node

process.chdir(__dirname);

const { test } = require("uvu");
const assert = require("uvu/assert");
const { execSync } = require("node:child_process");

test.before(() => {
    assert.not.throws(() =>
        execSync("npm i --no-save ../../../dist/npm/", {
            stdio: "inherit",
            windowsHide: true,
        }),
    );
});

test("Package can be required", () => {
    assert.not.throws(() => require("poodio"), "Not found: try running 'npm ls'");
});

test("Package executable version is correct", () => {
    const output = execSync("npx -y poodio --version", {
        encoding: "utf8",
        windowsHide: true,
    }).slice(0, -1);
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
