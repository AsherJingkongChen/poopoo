const C = require("node:child_process");
const F = require("node:fs");

module.exports = {
    buildPkgName(name) {
        const cpu = process.arch;
        const os = process.platform;
        const libc = require("detect-libc").familySync() || "unknown";
        return `@${name}/${name}-${cpu}-${os}-${libc}`;
    },
    buildPkgManager() {
        const cwd = process.cwd();
        if (F.existsSync(resolve(cwd, "bun.lockb"))) return "bun";
        if (F.existsSync(resolve(cwd, "pnpm-lock.yaml"))) return "pnpm";
        if (F.existsSync(resolve(cwd, "yarn.lock"))) return "yarn";
        if (F.existsSync(resolve(cwd, "package-lock.json"))) return "npm";
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
                C.execFileSync(buildPkgManager(), ["add", id, "--no-save"], {
                    stdio: "ignore",
                    windowsHide: true,
                });
                require.resolve(name);
            } catch (err) {
                throw new Error(`Failed to install the package "${id}": ${err.message}`);
            }
        }
    },
};
