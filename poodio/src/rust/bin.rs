//! Command line interface (CLI) for Poodio
//!
//! The library entry point is at [`poodio`]

#![deny(missing_docs)]

use poodio::*;

fn main() -> Result<()> {
    init()?;
    let _args = Arguments::parse();
    Ok(())
}
