#![warn(missing_docs)]
#![doc = include_str!("../README.md")]

pub mod cli;

/// [`poodio`](https://docs.rs/poodio)
#[cfg(feature = "bind-pyo3")]
#[pyo3::pymodule(name = "poodio")]
fn init_bind_pyo3(m: &pyo3::Bound<'_, pyo3::types::PyModule>) -> pyo3::PyResult<()> {
    use pyo3::{types::PyModuleMethods, wrap_pyfunction as wrap_pyfn};

    m.add_function(wrap_pyfn!(cli::main, m)?)?;
    m.add_function(wrap_pyfn!(cli::version, m)?)?;

    Ok(())
}
