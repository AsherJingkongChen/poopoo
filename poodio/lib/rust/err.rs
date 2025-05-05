//! Error handling module.

pub use thiserror::Error;

/// Error enums for [`poodio`](crate).
#[derive(Debug, Error)]
pub enum Error {
    /// The process exits with a specific code.
    #[error("Exit with code: {0}")]
    Exit(i32),

    /// It is converted from [`std::io::Error`].
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}
