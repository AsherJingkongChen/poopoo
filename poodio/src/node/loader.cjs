const F = require("node:fs");
const P = require("node:path");

module.exports = {
    buildPkgName(name) {
        const cpu = process.arch;
        const os = process.platform;
        const libc = process.libc();
        return `@${name}/${name}-${cpu}-${os}-${libc}`;
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

let _libc;
process.libc = function libc() {
    if (_libc) {
        return _libc;
    }

    _libc = "unknown";
    if (process.platform !== "linux") {
        return _libc;
    }

    try {
        const content = require("node:fs").readFileSync("/usr/bin/ldd", "utf8");
        if (content.includes("musl")) {
            _libc = "musl";
        } else if (content.includes("GNU C Library")) {
            _libc = "glibc";
        }
        return _libc;
    } catch {}

    const originalExclude = process.report.excludeNetwork;
    process.report.excludeNetwork = true;
    const report = process.report.getReport();
    process.report.excludeNetwork = originalExclude;
    if (report.header?.glibcVersionRuntime) {
        _libc = "glibc";
    } else if (
        Array.isArray(report.sharedObjects) &&
        report.sharedObjects.some(
            (obj) => obj.includes("libc.musl-") || obj.includes("ld-musl-"),
        )
    ) {
        _libc = "musl";
    }
    return _libc;
};
