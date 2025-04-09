#! /usr/bin/env node

process.chdir(__dirname);

const fs = require("node:fs");
const { test } = require("uvu");
const assert = require("uvu/assert");

const BIN_PATH =
    "../../../dist/bin/poodio" + (process.platform === "win32" ? ".exe" : "");

test("Executable is runnable", () => {
    assert.ok(fs.existsSync(BIN_PATH), `Not found: ${BIN_PATH} (cwd: ${process.cwd()})`);
    const stat = fs.statSync(BIN_PATH);
    assert.ok(stat.isFile(), `Not a file: ${BIN_PATH}`);
    assert.ok(
        stat.mode & 0o111,
        `Not an executable: ${BIN_PATH} (mode: ${stat.mode.toString(8)})`,
    );
});

test("Executable default output is correct", () => {
    const output = require("node:child_process").execSync(BIN_PATH, {
        encoding: "utf8",
        windowsHide: true,
    });
    assert.is(output, "Greetings from poodio!\n");
});

test.run();
