#! /usr/bin/env node

process.libc = (() => {
    let o;
    if (process.platform !== "linux") return;
    try {
        const l = require("node:fs").readFileSync("/usr/bin/ldd", "utf8");
        l.includes("musl") ? (o = "musl") : l.includes("GNU C Library") && (o = "glibc");
    } catch {}
    if (o) return o;
    const n = process.report.excludeNetwork;
    process.report.excludeNetwork = !0;
    const r = process.report.getReport();
    process.report.excludeNetwork = n;
    r.header?.glibcVersionRuntime
        ? (o = "glibc")
        : Array.isArray(r.sharedObjects) &&
          r.sharedObjects.some(
              (obj) => obj.includes("libc.musl-") || obj.includes("ld-musl-"),
          ) &&
          (o = "musl");
    return o;
})();

const { name } = require("../../package.json");
const { argv, arch: cpu, platform: os, libc } = process;
const m = require(`@${name}/${name}-${cpu}-${os}-${libc || "unknown"}`);
require.main === module ? m.main(argv.slice(1)) : (module.exports = m);
