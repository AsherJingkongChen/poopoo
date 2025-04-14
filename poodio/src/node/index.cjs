#! /usr/bin/env node

require("tell-libc");
const { name } = require("../../package.json");
const { argv, arch: cpu, platform: os, libc } = process;
const m = require(`@${name}/${name}-${cpu}-${os}-${libc || "unknown"}`);
module.exports = m;
require.main === module && m.main(argv.slice(1));
