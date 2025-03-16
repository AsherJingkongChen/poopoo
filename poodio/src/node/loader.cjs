const F = require("node:fs");
const P = require("node:path");

module.exports = {
    buildPkgName(name) {
        const cpu = process.arch;
        const os = process.platform;
        const libc = require("detect-libc").familySync() || "unknown";
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
