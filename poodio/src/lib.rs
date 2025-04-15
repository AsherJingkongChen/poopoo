#![doc = include_str!("../README.md")]
#![deny(missing_docs)]

pub mod cli;

/// [`poodio`](https://docs.rs/poodio)
#[pyo3::pymodule(name = "poodio")]
fn init_pyo3(m: &pyo3::Bound<'_, pyo3::types::PyModule>) -> pyo3::PyResult<()> {
    use pyo3::{types::PyModuleMethods, wrap_pyfunction};

    m.add_function(wrap_pyfunction!(cli::main, m)?)?;
    m.add_function(wrap_pyfunction!(cli::version, m)?)?;

    Ok(())
}
