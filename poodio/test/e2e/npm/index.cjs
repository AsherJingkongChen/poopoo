#! /usr/bin/env node

process.chdir(__dirname);

const { test } = require("uvu");
const assert = require("uvu/assert");

test("Package can be required", () => {
    assertNotThrows(() => require("poodio"));
});

test("Package executable version is correct", () => {
    const output = require("node:child_process")
        .execSync("npx poodio --version", {
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

test.run();

function answerVersion() {
    return `poodio@${require("poodio/package.json").version}`;
}

function assertNotThrows(fn) {
    try {
        fn();
    } catch (e) {
        assert.ok(0, e);
    }
}
