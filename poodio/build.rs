use color_eyre::eyre::Result;

fn main() -> Result<()> {
    println!("cargo:rerun-if-changed=");
    std::env::set_var("RUST_BACKTRACE", "full");

    color_eyre::install()?;

    #[cfg(feature = "bind-napi")]
    {
        bind_napi::write_cfgs()?;
        bind_napi::write_common_main()?;
    }

    #[cfg(feature = "bind-pyo3")]
    {
        pyo3_build_config::add_extension_module_link_args();
        pyo3_build_config::add_python_framework_link_args();
        pyo3_build_config::use_pyo3_cfgs();
    }
    Ok(())
}

#[cfg(feature = "bind-napi")]
mod bind_napi {
    use super::*;
    use serde::Serialize;
    use serde_json::{json, ser::PrettyFormatter, Serializer};
    use std::{collections::BTreeMap, fs, io::Write, path::Path, sync::LazyLock};

    static CARGO_TO_NPM_TARGET: LazyLock<BTreeMap<&str, [&str; 3]>> = LazyLock::new(|| {
        [
            ("aarch64-apple-darwin", ["arm64", "darwin", "unknown"]),
            ("aarch64-pc-windows-msvc", ["arm64", "win32", "unknown"]),
            ("aarch64-unknown-linux-gnu", ["arm64", "linux", "glibc"]),
            ("x86_64-apple-darwin", ["x64", "darwin", "unknown"]),
            ("x86_64-pc-windows-msvc", ["x64", "win32", "unknown"]),
            ("x86_64-unknown-linux-gnu", ["x64", "linux", "glibc"]),
        ]
        .into_iter()
        .collect()
    });

    static NPM_KEYWORDS: LazyLock<Vec<&str>> = LazyLock::new(|| {
        let mut v = r#"
            addon agent ai api audio binding cli easy
            fast fun funny joke lightweight llm mcp minimal
            multimedia napi native node performance poodio
            python rust server simple simulation sound speed test
        "#
        .split_ascii_whitespace()
        .collect::<Vec<_>>();
        v.sort_unstable();
        v.dedup();
        v
    });

    pub fn write_cfgs() -> Result<()> {
        use color_eyre::eyre::ContextCompat;

        napi_build::setup();

        if std::env::var("DOCS_RS").is_ok() {
            return Ok(());
        }

        let name = env!("CARGO_PKG_NAME");
        let target = std::env::var("TARGET")?;
        let version = env!("CARGO_PKG_VERSION");
        let &[cpu, os, libc] = CARGO_TO_NPM_TARGET
            .get(target.as_str())
            .wrap_err("Unsupported target")?;

        let dist = Path::new("dist/npm/");
        let common_dist = dist.join("common/");
        let native_dist = dist.join("native/");
        let config_name = Path::new("package.json");
        let license_name = Path::new("LICENSE.txt");
        let readme_name = Path::new(env!("CARGO_PKG_README"));

        let config = json!({
            "author": env!("CARGO_PKG_AUTHORS"),
            "description": env!("CARGO_PKG_DESCRIPTION"),
            "homepage": env!("CARGO_PKG_HOMEPAGE"),
            "keywords": *NPM_KEYWORDS,
            "license": env!("CARGO_PKG_LICENSE"),
            "repository": {
                "directory": name,
                "type": "git",
                "url": format!("git+{}", env!("CARGO_PKG_REPOSITORY")),
            },
            "type": "commonjs",
            "version": version,
        });

        let mut native_config = config.to_owned();
        let v = native_config.as_object_mut().unwrap();
        v.insert("cpu".into(), json!([cpu]));
        if libc != "unknown" {
            v.insert("libc".into(), json!([libc]));
        }
        v.insert(
            "name".into(),
            format!("@{name}/{name}-{cpu}-{os}-{libc}").into(),
        );
        v.insert("os".into(), json!([os]));

        let mut common_config = config.to_owned();
        let v = common_config.as_object_mut().unwrap();
        v.insert("bin".into(), json!({ name: "index.js" }));
        v.insert("dependencies".into(), json!({ "tell-libc": "^0.0.0" }));
        v.insert(
            "optionalDependencies".into(),
            CARGO_TO_NPM_TARGET
                .values()
                .map(|[cpu, os, libc]| (format!("@{name}/{name}-{cpu}-{os}-{libc}"), version))
                .collect(),
        );
        v.insert("name".into(), name.into());

        fs::create_dir_all(&common_dist)?;
        fs::create_dir_all(&native_dist)?;
        fs::copy(license_name, common_dist.join(license_name))?;
        fs::copy(license_name, native_dist.join(license_name))?;
        fs::copy(readme_name, common_dist.join(readme_name))?;
        fs::copy(readme_name, native_dist.join(readme_name))?;
        write_json_pretty(
            fs::File::create(common_dist.join(config_name))?,
            &common_config,
        )?;
        write_json_pretty(
            fs::File::create(native_dist.join(config_name))?,
            &native_config,
        )?;

        Ok(())
    }

    pub fn write_common_main() -> Result<()> {
        let dir = Path::new("dist/npm/common/");
        let name = env!("CARGO_PKG_NAME");
        let data = format!(
            "#!/usr/bin/env node\n\
            require(\"tell-libc\");let{{argv:r,arch:e,platform:o,libc:i}}=process;\n\
            module.exports=require(`@{name}/{name}-${{e}}-${{o}}-${{i||\"unknown\"}}`);\n\
            require.main===module&&module.exports.main(r.slice(1));\n"
        );

        let mut file = fs::File::create(dir.join("index.js"))?;
        file.write_all(data.as_bytes())?;
        let mut perm = file.metadata()?.permissions();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            perm.set_mode(perm.mode() | 0o111);
        }
        file.set_permissions(perm)?;

        Ok(())
    }

    fn write_json_pretty<W: Write, T: Serialize>(
        writer: W,
        value: &T,
    ) -> Result<()> {
        let mut serializer =
            Serializer::with_formatter(writer, PrettyFormatter::with_indent(b"    "));
        value.serialize(&mut serializer)?;
        serializer.into_inner().write_all(b"\n")?;
        Ok(())
    }
}
