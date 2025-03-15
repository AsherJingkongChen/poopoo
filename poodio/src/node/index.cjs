const pm = require("package-manager-detector");

// Resolve the package name for the current platform
const cpu = process.arch;
const os = process.platform;
const libc = require("detect-libc").familySync() || "unknown";
const { name, version } = require("../../package.json");
const pkgName = `@${name}/${cpu}-${os}- ${libc}`;
const pkgNameWithVers = `${pkgName}@${version}`;

// Install the package if not found
try {
    require.resolve(pkgName);
} catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
        installPackageSync(pkgNameWithVers);
    }
}

// Export the package
module.exports = require(pkgName);

function installPackageSync(pkgNameWithVers) {
    const agent = require("@kaciras/deasync").awaitSync(pm.detect())?.agent;
    const request = pm.resolveCommand(agent, "add", ["--no-save", pkgNameWithVers]);
    if (!request) {
        throw new Error(
            `Could not find a package manager to install "${pkgNameWithVers}"`
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
    } catch (error) {
        throw new Error(
            `Failed to install the package "${pkgNameWithVers}": ${error.message}`
        );
    }
}
