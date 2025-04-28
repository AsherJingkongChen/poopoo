use color_eyre::eyre;

fn main() -> eyre::Result<()> {
    color_eyre::install()?;
    std::env::set_current_dir(env!("CARGO_MANIFEST_DIR"))?;
    bind_napi::generate()?;
    bind_pyo3::generate()?;
    Ok(())
}

#[cfg(feature = "bind-napi")]
mod bind_napi {
    use super::*;
    use eyre::{ContextCompat, Result};
    use serde::Serialize;
    use serde_json::{json, ser, Serializer};
    use std::{collections::BTreeMap, fs, io::Write, path::Path, sync::LazyLock};

    pub fn generate() -> Result<()> {
        write_common_entry()?;
        write_configs()?;
        Ok(())
    }

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
            addon agent ai api audio binding cli command easy executable
            fast fun funny joke library lightweight llm low-latency mcp
            minimal module multimedia music napi native node performance
            poodio processing pyo3 python real-time rust script server
            simple simulation sound speed synthesis synthesizer tool utility
        "#
        .split_ascii_whitespace()
        .collect::<Vec<_>>();
        v.sort_unstable();
        v.dedup();
        v
    });

    fn write_configs() -> Result<()> {
        let name = env!("CARGO_PKG_NAME");
        let target = env!("TARGET");
        let version = env!("CARGO_PKG_VERSION");
        let &[cpu, os, libc] = CARGO_TO_NPM_TARGET
            .get(target)
            .wrap_err("Unsupported target")?;

        let dist = Path::new("dist/npm/");
        let common_dist = dist.join("common/");
        let native_dist = dist.join("native/");
        let config_name = "package.json";
        let entry_name = Path::new("index.js");
        let license_name = "LICENSE.txt";
        let readme_name = env!("CARGO_PKG_README");

        let config = json!({
            "author": env!("CARGO_PKG_AUTHORS"),
            "description": env!("CARGO_PKG_DESCRIPTION"),
            "engines": { "node": ">= 16" },
            "homepage": env!("CARGO_PKG_HOMEPAGE"),
            "keywords": *NPM_KEYWORDS,
            "license": env!("CARGO_PKG_LICENSE"),
            "repository": {
                "directory": name,
                "type": "git",
                "url": concat!("git+", env!("CARGO_PKG_REPOSITORY"), ".git"),
            },
            "type": "commonjs",
            "types": "index.d.ts",
            "version": version,
        });

        let mut native_config = config.to_owned();
        let v = native_config.as_object_mut().unwrap();
        v.insert("cpu".into(), json!([cpu]));
        if libc != "unknown" {
            v.insert("libc".into(), json!([libc]));
        }
        v.insert("main".into(), json!(entry_name.with_extension("node")));
        v.insert(
            "name".into(),
            format!("@{name}/{name}-{cpu}-{os}-{libc}").into(),
        );
        v.insert("os".into(), json!([os]));

        let mut common_config = config.to_owned();
        let v = common_config.as_object_mut().unwrap();
        v.insert("bin".into(), json!({ name: entry_name }));
        v.insert("dependencies".into(), json!({ "tell-libc": "0.0.1" }));
        v.insert("main".into(), json!(entry_name));
        v.insert("name".into(), name.into());
        v.insert(
            "optionalDependencies".into(),
            CARGO_TO_NPM_TARGET
                .values()
                .map(|[cpu, os, libc]| (format!("@{name}/{name}-{cpu}-{os}-{libc}"), version))
                .collect(),
        );

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

    fn write_common_entry() -> Result<()> {
        let name = env!("CARGO_PKG_NAME");
        let bang = "#!/usr/bin/env node";
        let deps = "require('tell-libc');";
        let args = "let{arch:r,platform:o,libc:i}=process;";
        let outs =
            format!("module.exports=require(`@{name}/{name}-${{r}}-${{o}}-${{i||'unknown'}}`);");
        let main = "require.main===module&&module.exports.main();";
        let data = format!("{bang}\n{deps}{args}{outs}{main}");

        let dir = Path::new("dist/npm/common");
        fs::create_dir_all(dir)?;

        let mut file = fs::File::create(dir.join("index.js"))?;
        file.write_all(data.as_ref())?;

        #[cfg(unix)]
        {
            let mut perm = file.metadata()?.permissions();
            use std::os::unix::fs::PermissionsExt;
            perm.set_mode(perm.mode() | 0o111);
            file.set_permissions(perm)?;
        }

        Ok(())
    }

    fn write_json_pretty<W: Write, T: Serialize>(
        writer: W,
        value: &T,
    ) -> Result<()> {
        let mut serializer =
            Serializer::with_formatter(writer, ser::PrettyFormatter::with_indent(b"    "));
        value.serialize(&mut serializer)?;
        serializer.into_inner().write_all(b"\n")?;
        Ok(())
    }
}

#[cfg(feature = "bind-pyo3")]
mod bind_pyo3 {
    use super::*;
    use eyre::{eyre, ContextCompat, Result};
    use std::{fs, path};

    pub fn generate() -> Result<()> {
        let stub = poodio::bind_pyo3_stub().map_err(|e| eyre!(e))?;
        let python_source = stub
            .pyproject
            .python_source()
            .unwrap_or_else(|| env!("CARGO_MANIFEST_DIR").into());
        for (name, module) in stub.modules {
            let path = python_source.join(name.replace(".", path::MAIN_SEPARATOR_STR));
            let path = if module.submodules.is_empty() {
                path.join("__init__.pyi")
            } else {
                path.with_extension("pyi")
            };
            fs::create_dir_all(path.parent().wrap_err("Failed to get parent directory")?)?;
            fs::write(&path, module.to_string())?;
        }
        Ok(())
    }
}

#[cfg(not(feature = "bind-napi"))]
mod bind_napi {
    use super::*;
    pub fn generate() -> eyre::Result<()> {
        Ok(())
    }
}

#[cfg(not(feature = "bind-pyo3"))]
mod bind_pyo3 {
    use super::*;
    pub fn generate() -> eyre::Result<()> {
        Ok(())
    }
}
