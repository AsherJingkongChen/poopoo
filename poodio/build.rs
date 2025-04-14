use color_eyre::eyre::{ContextCompat, Result};
use serde::Serialize;
use serde_json::{json, ser::PrettyFormatter, Serializer};
use std::{collections::BTreeMap, fs, io::Write, path::Path, sync::LazyLock};

fn main() -> Result<()> {
    std::env::set_var("RUST_BACKTRACE", "full");
    color_eyre::install()?;
    napi_build::setup();
    // pyo3_build_config::use_pyo3_cfgs();
    build_npm_dist()?;
    build_npm_test()?;
    Ok(())
}

static CARGO_TO_NPM_TARGET: LazyLock<BTreeMap<String, [String; 3]>> = LazyLock::new(|| {
    [
        ("aarch64-apple-darwin", ["arm64", "darwin", "unknown"]),
        ("aarch64-pc-windows-msvc", ["arm64", "win32", "unknown"]),
        ("aarch64-unknown-linux-gnu", ["arm64", "linux", "glibc"]),
        ("i686-pc-windows-msvc", ["ia32", "win32", "unknown"]),
        ("i686-unknown-linux-gnu", ["ia32", "linux", "glibc"]),
        ("x86_64-apple-darwin", ["x64", "darwin", "unknown"]),
        ("x86_64-pc-windows-msvc", ["x64", "win32", "unknown"]),
        ("x86_64-unknown-linux-gnu", ["x64", "linux", "glibc"]),
    ]
    .into_iter()
    .map(|(k, v)| (k.into(), v.map(Into::into)))
    .collect()
});

static NPM_KEYWORDS: LazyLock<Vec<String>> = LazyLock::new(|| {
    let mut result = r#"
        addon agent ai api audio binding cli easy
        fast fun funny joke lightweight llm mcp minimal
        multimedia napi native node performance poodio
        python rust server simple simulation sound speed test
    "#
    .split_ascii_whitespace()
    .map(Into::into)
    .collect::<Vec<_>>();
    result.sort_unstable();
    result.dedup();
    result
});

fn build_npm_dist() -> Result<()> {
    if std::env::var("DOCS_RS").is_ok() {
        return Ok(());
    }

    let name = env!("CARGO_PKG_NAME");
    let version = env!("CARGO_PKG_VERSION");
    let target = std::env::var("TARGET")?;
    let [cpu, os, libc] = CARGO_TO_NPM_TARGET
        .get(&target)
        .cloned()
        .wrap_err("Unsupported target")?;

    let dist_dir = Path::new("dist/npm/");
    let dist_bind_dir = dist_dir.join("bind/");
    let dist_bind_cfg_file = dist_bind_dir.join("package.json");
    let dist_bind_license_file = dist_bind_dir.join("LICENSE.txt");
    let dist_bind_readme_file = dist_bind_dir.join("README.md");
    let dist_wrap_dir = dist_dir.join("wrap/");
    let dist_wrap_cfg_file = dist_wrap_dir.join("package.json");
    let dist_wrap_license_file = dist_wrap_dir.join("LICENSE.txt");
    let dist_wrap_readme_file = dist_wrap_dir.join("README.md");

    let dist_cfg = json!({
        "author": env!("CARGO_PKG_AUTHORS"),
        "description": env!("CARGO_PKG_DESCRIPTION"),
        "homepage": env!("CARGO_PKG_HOMEPAGE"),
        "keywords": *NPM_KEYWORDS,
        "license": env!("CARGO_PKG_LICENSE"),
        "repository": {
            "directory": "poodio",
            "type": "git",
            "url": format!("git+{}", env!("CARGO_PKG_REPOSITORY")),
        },
        "type": "commonjs",
        "version": version,
    });
    let orig_license_file = Path::new("LICENSE.txt");
    let orig_readme_file = Path::new("README.md");

    let mut dist_bind_cfg = dist_cfg.to_owned();
    let o = dist_bind_cfg.as_object_mut().unwrap();
    o.insert("cpu".into(), json!([cpu]));
    if libc != "unknown" {
        o.insert("libc".into(), json!([libc]));
    }
    o.insert(
        "name".into(),
        format!("@{name}/{name}-{cpu}-{os}-{libc}").into(),
    );
    o.insert("os".into(), json!([os]));

    let mut dist_wrap_cfg = dist_cfg.to_owned();
    let o = dist_wrap_cfg.as_object_mut().unwrap();
    o.insert("bin".into(), json!({ name: "index.js" }));
    o.insert("dependencies".into(), json!({ "tell-libc": "^0.0.0" }));
    o.insert(
        "optionalDependencies".into(),
        CARGO_TO_NPM_TARGET
            .values()
            .map(|[cpu, os, libc]| {
                (
                    format!("@{name}/{name}-{cpu}-{os}-{libc}"),
                    version.to_owned(),
                )
            })
            .collect(),
    );
    o.insert("name".into(), name.into());

    fs::create_dir_all(&dist_bind_dir)?;
    fs::create_dir_all(&dist_wrap_dir)?;

    fs::copy(orig_license_file, &dist_bind_license_file)?;
    fs::copy(orig_license_file, &dist_wrap_license_file)?;
    fs::copy(orig_readme_file, &dist_bind_readme_file)?;
    fs::copy(orig_readme_file, &dist_wrap_readme_file)?;

    write_json_pretty(fs::File::create(&dist_bind_cfg_file)?, &dist_bind_cfg)?;
    write_json_pretty(fs::File::create(&dist_wrap_cfg_file)?, &dist_wrap_cfg)?;

    println!("cargo:rerun-if-changed={dist_bind_cfg_file:?}");
    println!("cargo:rerun-if-changed={dist_wrap_cfg_file:?}");

    Ok(())
}

fn build_npm_test() -> Result<()> {
    if std::env::var("DOCS_RS").is_ok() {
        return Ok(());
    }

    let name = env!("CARGO_PKG_NAME");

    let dist_dir = "../../../dist/npm/";
    let test_cfg_file = Path::new("test/e2e/npm/package.json");

    let mut test_cfg = json!({
        "bin": "index.cjs",
        "name": format!("@{name}/test-e2e-npm"),
        "private": true,
    });
    let o = test_cfg.as_object_mut().unwrap();
    o.insert(
        "dependencies".into(),
        [("poodio".to_owned(), format!("file:{dist_dir}wrap/"))]
            .into_iter()
            .collect(),
    );
    o.insert(
        "optionalDependencies".into(),
        CARGO_TO_NPM_TARGET
            .values()
            .map(|[cpu, os, libc]| {
                (
                    format!("@{name}/{name}-{cpu}-{os}-{libc}"),
                    format!("file:{dist_dir}bind/"),
                )
            })
            .collect(),
    );

    write_json_pretty(fs::File::create(test_cfg_file)?, &test_cfg)?;

    Ok(())
}

fn write_json_pretty<W: Write, T: Serialize>(
    writer: W,
    value: &T,
) -> Result<()> {
    let mut serializer = Serializer::with_formatter(writer, PrettyFormatter::with_indent(b"    "));
    value.serialize(&mut serializer)?;
    serializer.into_inner().write_all(b"\n")?;
    Ok(())
}
