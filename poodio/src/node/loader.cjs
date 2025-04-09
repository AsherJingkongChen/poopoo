module.exports = {
    buildPkgName,
    formatPkgName,
};

function buildPkgName(name) {
    return formatPkgName({
        name,
        cpu: process.arch,
        os: process.platform,
        libc: process.libc,
    });
}
function formatPkgName({ name, cpu, os, libc }) {
    return `@${name}/${name}-${cpu}-${os}-${libc || "unknown"}`;
}

var _libc;
Object.defineProperty(process, "libc", {
    get: function libc() {
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
    },
    configurable: true,
    enumerable: true,
});
