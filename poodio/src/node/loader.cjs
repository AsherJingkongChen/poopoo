const C = require("node:child_process");
const F = require("node:fs");
const P = require("node:path");

module.exports = {
    buildPkgName(name) {
        const cpu = process.arch;
        const os = process.platform;
        const libc = require("detect-libc").familySync() || "unknown";
        return `@${name}/${name}-${cpu}-${os}-${libc}`;
    },
    buildPkgManager() {
        const cwd = process.cwd();
        if (F.existsSync(P.resolve(cwd, "bun.lockb"))) return "bun";
        if (F.existsSync(P.resolve(cwd, "pnpm-lock.yaml"))) return "pnpm";
        if (F.existsSync(P.resolve(cwd, "yarn.lock"))) return "yarn";
        if (F.existsSync(P.resolve(cwd, "package-lock.json"))) return "npm";
        for (const pm of ["bun", "pnpm", "yarn"]) {
            try {
                if (
                    /^\d+\.\d+\.\d+$/.test(
                        C.execFileSync(pm, ["--version"], { encoding: "utf8" }).trim(),
                    )
                ) {
                    return pm;
                }
            } catch {}
        }
        return "npm";
    },
    tryInstallPkg(name, version) {
        try {
            require.resolve(name);
        } catch (err) {
            if (err.code !== "MODULE_NOT_FOUND") {
                return;
            }

            const id = `${name}@${version}`;
            try {
                C.execFileSync(this.buildPkgManager(), ["add", id, "--no-save"], {
                    stdio: "pipe",
                    windowsHide: true,
                });
                require.resolve(name);
            } catch (err) {
                throw new Error(`Failed to install the package "${id}": ${err.message}`);
            }
        }
    },
};
