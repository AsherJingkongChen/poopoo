#! /usr/bin/env node

process.chdir(__dirname);

const fs = require("node:fs");
const { test } = require("uvu");
const assert = require("uvu/assert");

const BIN_PATH =
    "../../../dist/bin/poodio" + (process.platform === "win32" ? ".exe" : "");

test("Executable is available", () => {
    assert.ok(fs.existsSync(BIN_PATH), `Not found: '${BIN_PATH}'`);
    const stat = fs.statSync(BIN_PATH);
    assert.ok(stat.isFile(), `Not a file: '${BIN_PATH}'`);
    assert.not.throws(
        () => fs.accessSync(BIN_PATH, fs.constants.X_OK),
        `Not an executable: '${BIN_PATH}'`,
    );
});

test("Executable version is correct", () => {
    const output = require("node:child_process")
        .execFileSync(BIN_PATH, ["--version"], {
            encoding: "utf8",
            windowsHide: true,
        })
        .trimEnd();
    assert.is(output, answerVersion());
});

function answerVersion() {
    return `poodio@${require("../../../dist/npm/package.json").version}`;
}

test.run();
