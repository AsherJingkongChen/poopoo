#! /usr/bin/env node

process.chdir(__dirname);

const fs = require("node:fs");
const { test } = require("uvu");
const assert = require("uvu/assert");

test("The executable has been built", () => {
    const file =
        "../../../dist/bin/poodio" + (process.platform === "win32" ? ".exe" : "");
    assert.ok(fs.existsSync(file), `Not found: ${file} (cwd: ${process.cwd()})`);
    const stat = fs.statSync(file);
    assert.ok(stat.isFile(), `Not a file: ${file}`);
    assert.ok(
        stat.mode & 0o111,
        `Not an executable: ${file} (mode: ${stat.mode.toString(8)})`,
    );
});

test.run();
