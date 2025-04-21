#![cfg_attr(any(clippy, docsrs), deny(warnings))]
#![cfg_attr(docsrs, feature(doc_auto_cfg))]
#![warn(missing_docs)]
#![doc = include_str!("../README.md")]

pub mod cli;
pub mod err;

// TODO: Add docs
#[cfg(feature = "bind-napi")]
#[napi::module_init]
fn init_bind_napi() {
    cli::init();
}

#[cfg(feature = "bind-pyo3")]
#[pyo3::pymodule(name = "poodio")]
fn init_bind_pyo3(m: &pyo3::Bound<'_, pyo3::types::PyModule>) -> pyo3::PyResult<()> {
    use pyo3::{types::PyModuleMethods, wrap_pyfunction as wrap_pyfn};

    cli::init();
    m.add_function(wrap_pyfn!(cli::main, m)?)?;
    m.add_function(wrap_pyfn!(cli::version, m)?)?;

    Ok(())
}
