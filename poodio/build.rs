use color_eyre::eyre::Result;
use serde::{Deserialize, Serialize};
use serde_json::{
    from_reader as read_json, from_value as from_json, ser::PrettyFormatter,
    to_value as into_json, Serializer, Value as Json,
};
use std::{
    fs::{self, File},
    io::Write,
    path::Path,
};

fn main() -> Result<()> {
    println!("cargo:rerun-if-changed=build.rs");
    color_eyre::install()?;
    napi_build::setup();
    build_npm_pkg()?;
    Ok(())
}

fn build_npm_pkg() -> Result<()> {
    use package_json::{
        PackageBin as Bin, PackageJson, PackagePeople as People,
        PackageRepository as Repository, PackageRepositoryRecord as RepositoryRecord,
        PACKAGE_JSON_FILENAME,
    };

    const NPM_PKG_NAME: &str = env!("CARGO_PKG_NAME");
    const NPM_PKG_VERSION: &str = env!("CARGO_PKG_VERSION");
    const NPM_PKG_TARGETS: &[&str] = &[
        "arm64-darwin-unknown",
        "arm64-linux-glibc",
        "arm64-win32-unknown",
        "ia32-win32-unknown",
        "ia32-linux-glibc",
        "x64-darwin-unknown",
        "x64-win32-unknown",
        "x64-linux-glibc",
    ];

    println!("cargo:rerun-if-changed=package.json");

    let npm_pkg_file_path =
        Path::new(env!("CARGO_MANIFEST_DIR")).join(PACKAGE_JSON_FILENAME);
    let mut npm_pkg: PackageJson = File::create_new(&npm_pkg_file_path)
        .map(|_| Default::default())
        .or_else(|_| {
            read_json(File::open(&npm_pkg_file_path)?).or_else(|_| {
                fs::remove_file(&npm_pkg_file_path).map(|_| Default::default())
            })
        })?;

    npm_pkg.author = option_env!("CARGO_PKG_AUTHORS").map(|v| People::Literal(v.into()));
    npm_pkg.bin = Some(Bin::Literal(format!("src/node/{NPM_PKG_NAME}.cjs")));
    npm_pkg.description = option_env!("CARGO_PKG_DESCRIPTION").map(Into::into);
    npm_pkg.homepage = option_env!("CARGO_PKG_HOMEPAGE").map(Into::into);
    npm_pkg.license = option_env!("CARGO_PKG_LICENSE").map(Into::into);
    npm_pkg.main = "src/node/index.cjs".to_string();
    npm_pkg.name = NPM_PKG_NAME.into();
    npm_pkg.repository = option_env!("CARGO_PKG_REPOSITORY").map(|v| {
        Repository::Record(RepositoryRecord {
            directory: Some("poodio".into()),
            r#type: "git".into(),
            url: format!("git+{v}"),
        })
    });
    npm_pkg.r#type = "commonjs".into();
    npm_pkg.types = Some("src/node/index.d.ts".to_string());
    npm_pkg.version = NPM_PKG_VERSION.into();

    let npm_pkg_files = npm_pkg.files.get_or_insert(Default::default());
    if !npm_pkg_files.contains(&"src/node/".into()) {
        npm_pkg_files.push("src/node/".into());
    }

    let npm_pkg_opt_deps = npm_pkg
        .optional_dependencies
        .get_or_insert(Default::default());
    for npm_pkg_target in NPM_PKG_TARGETS {
        let opt_dep_name = format!("@{NPM_PKG_NAME}/{NPM_PKG_NAME}-{npm_pkg_target}");
        npm_pkg_opt_deps.insert(opt_dep_name, NPM_PKG_VERSION.into());
    }

    let mut npm_pkg_fp = File::create(&npm_pkg_file_path)?;
    into_sorted_json(npm_pkg)?.serialize(&mut Serializer::with_formatter(
        &mut npm_pkg_fp,
        PrettyFormatter::with_indent(b"    "),
    ))?;
    npm_pkg_fp.write_all(b"\n")?;

    Ok(())
}

fn into_sorted_json(value: impl Serialize) -> Result<Json> {
    #[derive(Deserialize, Serialize)]
    struct SortedJson {
        #[serde(flatten)]
        __rest: Json,
    }
    Ok(into_json(from_json::<SortedJson>(into_json(value)?)?)?)
}
