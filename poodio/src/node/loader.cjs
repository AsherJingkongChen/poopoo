module.exports = {
    buildPkgNameForPlatform(name) {
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

            const pm = require("package-manager-detector");
            const agent = require("@kaciras/deasync").awaitSync(pm.detect())?.agent;
            const fullName = `${name}@${version}`;
            const request = pm.resolveCommand(agent, "add", ["--no-save", fullName]);
            if (!request) {
                throw new Error(
                    `Could not find a package manager to install "${fullName}"`
                );
            }
            try {
                require("node:child_process").execSync(
                    `${request.command} ${request.args.join(" ")}`,
                    {
                        stdio: "ignore",
                        windowsHide: true,
                    }
                );
            } catch (err) {
                throw new Error(
                    `Failed to install the package "${fullName}": ${err.message}`
                );
            }
        }
    },
};
