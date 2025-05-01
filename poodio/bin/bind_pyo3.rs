use color_eyre::eyre::{eyre, ContextCompat, Result};
use std::fs;

fn main() -> Result<()> {
    color_eyre::install()?;
    std::env::set_current_dir(env!("CARGO_MANIFEST_DIR"))?;

    let stub = poodio::bind_pyo3_stub().map_err(|e| eyre!(e))?;
    let python_source = stub.pyproject.python_source().unwrap_or_default();
    for (name, module) in stub.modules {
        let path = python_source.join(name.replace(".", std::path::MAIN_SEPARATOR_STR));
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
