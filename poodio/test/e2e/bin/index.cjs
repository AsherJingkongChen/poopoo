#! /usr/bin/env node

process.chdir(__dirname);

const fs = require("node:fs");
const { test } = require("uvu");
const assert = require("uvu/assert");

const BIN_PATH = `../../../dist/bin/poodio${process.platform === "win32" ? ".exe" : ""}`;

test("Executable is available", () => {
    assert.ok(fs.existsSync(BIN_PATH), `Not found: '${BIN_PATH}'`);
    const stat = fs.statSync(BIN_PATH);
    assert.ok(stat.isFile(), `Not a file: '${BIN_PATH}'`);
    assertNotThrows(() => fs.accessSync(BIN_PATH, fs.constants.X_OK));
});

test("Executable is ok with options '--version'", () => {
    assertNotThrows(() =>
        require("node:child_process").execFileSync(BIN_PATH, ["--version"], {
            encoding: "utf8",
            windowsHide: true,
        }),
    );
});

test.run();

function assertNotThrows(fn) {
    try {
        fn();
    } catch (e) {
        assert.ok(0, e);
    }
}
