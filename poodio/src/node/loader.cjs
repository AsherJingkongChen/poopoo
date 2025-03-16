const F = require("node:fs");
const P = require("node:path");

module.exports = {
    buildPkgName(name) {
        const libc = process.libc() || "unknown";
        return `@${name}/${name}-${process.arch}-${process.platform}-${libc}`;
    },
    copyPkgSrc(srcFilename) {
        F.cp(
            P.dirname(srcFilename),
            __dirname,
            { recursive: true, force: true },
            (err) => {
                if (err) {
                    return;
                }
                F.rm(__filename, { force: true }, () => {});
            },
        );
    },
};

var _libc;
process.libc = function libc() {
    if (_libc || process.platform !== "linux") return _libc;

    try {
        const ld = require("node:fs").readFileSync("/usr/bin/ldd", "utf8");
        ld.includes("musl")
            ? (_libc = "musl")
            : ld.includes("GNU C Library") && (_libc = "glibc");
    } catch {}
    if (_libc) return _libc;

    const noNet = process.report.excludeNetwork;
    process.report.excludeNetwork = !0;
    const report = process.report.getReport();
    process.report.excludeNetwork = noNet;
    report.header?.glibcVersionRuntime
        ? (_libc = "glibc")
        : Array.isArray(report.sharedObjects) &&
          report.sharedObjects.some(
              (obj) => obj.includes("libc.musl-") || obj.includes("ld-musl-"),
          ) &&
          (_libc = "musl");
    return _libc;
};
