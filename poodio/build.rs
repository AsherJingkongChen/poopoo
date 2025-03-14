use color_eyre::eyre::Result;
use serde_json::{from_reader as read_json, to_writer_pretty as write_json};
use std::{fs::File, path::Path};

fn main() -> Result<()> {
    println!("cargo:rerun-if-changed=build.rs");
    color_eyre::install()?;
    napi_build::setup();
    build_npm_pkg()?;
    Ok(())
}

fn build_npm_pkg() -> Result<()> {
    use package_json::{
        PackageBin as Bin, PackageJson, PackagePeople as People, PackageRepository as Repository,
        PACKAGE_JSON_FILENAME,
    };

    println!("cargo:rerun-if-changed=package.json");

    const NPM_PKG_FILES_0: &str = "src/node/";
    const NPM_PKG_NAME: &str = env!("CARGO_PKG_NAME");
    const NPM_PKG_VERSION: &str = env!("CARGO_PKG_VERSION");
    const NPM_PKG_TARGETS: &[&str] = &[
        "aarch64-apple-darwin",
        "x86_64-unknown-linux-gnu",
        "x86_64-pc-windows-msvc",
    ];

    let npm_pkg_fp = Path::new(env!("CARGO_MANIFEST_DIR")).join(PACKAGE_JSON_FILENAME);
    let mut npm_pkg = if File::create_new(&npm_pkg_fp).is_err() {
        read_json(File::open(&npm_pkg_fp)?)?
    } else {
        PackageJson::default()
    };

    npm_pkg.author = option_env!("CARGO_PKG_AUTHORS").map(|v| People::Literal(v.into()));
    npm_pkg.bin = Some(Bin::Literal(format!("{NPM_PKG_FILES_0}{NPM_PKG_NAME}")));
    npm_pkg.description = option_env!("CARGO_PKG_DESCRIPTION").map(Into::into);
    npm_pkg.homepage = option_env!("CARGO_PKG_HOMEPAGE").map(Into::into);
    npm_pkg.license = option_env!("CARGO_PKG_LICENSE").map(Into::into);
    npm_pkg.main = format!("{NPM_PKG_FILES_0}index.js");
    npm_pkg.name = NPM_PKG_NAME.into();
    npm_pkg.r#type = "commonjs".into();
    npm_pkg.types = Some(format!("{NPM_PKG_FILES_0}index.d.ts"));
    npm_pkg.repository = option_env!("CARGO_PKG_REPOSITORY").map(|v| Repository::Url(v.into()));
    npm_pkg.version = NPM_PKG_VERSION.into();

    let npm_pkg_files = npm_pkg.files.get_or_insert_default();
    if !npm_pkg_files.contains(&NPM_PKG_FILES_0.into()) {
        npm_pkg_files.push(NPM_PKG_FILES_0.into());
    }

    let npm_pkg_opt_deps = npm_pkg.optional_dependencies.get_or_insert_default();
    for npm_pkg_target in NPM_PKG_TARGETS {
        npm_pkg_opt_deps.insert(
            format!("@{NPM_PKG_NAME}/{NPM_PKG_NAME}-{npm_pkg_target}"),
            NPM_PKG_VERSION.into(),
        );
    }

    write_json(File::create(&npm_pkg_fp)?, &npm_pkg)?;

    Ok(())
}
