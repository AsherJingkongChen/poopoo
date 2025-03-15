module.exports = {
    buildPkgName(name) {
        const cpu = process.arch;
        const os = process.platform;
        const libc = require("detect-libc").familySync() || "unknown";
        return `@${name}/${name}-${cpu}-${os}-${libc}`;
    },
    tryInstallPkg(name, version) {
        try {
            require.resolve(name);
        } catch (err) {
            if (err.code !== "MODULE_NOT_FOUND") {
                return;
            }

            const PM = require("package-manager-detector");
            const agent = require("@kaciras/deasync").awaitSync(PM.detect())?.agent;
            const id = `${name}@${version}`;
            const request = PM.resolveCommand(agent, "add", ["--no-save", id]);
            if (!request) {
                throw new Error(`Could not find a package manager to install "${id}"`);
            }
            try {
                require("node:child_process").execFileSync(
                    request.command,
                    request.args,
                    {
                        stdio: "ignore",
                        windowsHide: true,
                    },
                );
                require.resolve(name);
            } catch (err) {
                throw new Error(`Failed to install the package "${id}": ${err.message}`);
            }
        }
    },
};
