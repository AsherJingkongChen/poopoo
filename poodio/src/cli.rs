//! Command Line Interface (CLI) for [`poodio`](crate)

pub use clap::Parser;

use clap::builder::styling::{AnsiColor, Styles};
use color_eyre::{owo_colors::OwoColorize, Result};
use napi_derive::napi;
use pyo3::pyfunction;
use std::{
    env,
    io::{stderr, Write},
    process::exit,
};

#[derive(Clone, Debug, Parser, PartialEq)]
#[command(
    after_help = format!("See '{}' for more information.", "https://docs.rs/poodio".cyan()),
    arg_required_else_help = true,
    help_template = "{about}\n\n{usage-heading} {usage}\n\n{all-args}{after-help}",
    propagate_version = true,
    styles = Styles::styled()
        .error(AnsiColor::Red.on_default().bold())
        .header(AnsiColor::Green.on_default().bold())
        .invalid(AnsiColor::Yellow.on_default().bold())
        .literal(AnsiColor::Cyan.on_default().bold())
        .placeholder(AnsiColor::Cyan.on_default())
        .usage(AnsiColor::Green.on_default().bold())
        .valid(AnsiColor::Cyan.on_default().bold()),
    version,
    verbatim_doc_comment,
)]
/// Poodio farts poo poo audio
pub struct Arguments {}

/// Command Line Interface (CLI) entry point for [`poodio`](https://docs.rs/poodio).
#[pyfunction(name = "main")]
#[napi(js_name = "main")]
pub fn main(argv: Vec<String>) {
    || -> Result<()> {
        init()?;
        let _args = match Arguments::try_parse_from(argv) {
            Err(e) => {
                match e.kind() {
                    clap::error::ErrorKind::DisplayVersion => println!("{}", version()),
                    _ => e.print()?,
                };
                exit(e.exit_code());
            },
            r => r,
        };
        Ok(())
    }()
    .unwrap_or_else(|e| {
        if anstream::AutoStream::auto(stderr().lock())
            .write_all(format!("Error: {e:?}\n").as_bytes())
            .is_err()
        {
            log::error!(target: "poodio::main", "Failed to write error to stderr");
        }
        exit(1);
    });
}

/// Version tag
#[pyfunction]
#[napi]
pub const fn version() -> &'static str {
    concat!(env!("CARGO_PKG_NAME"), "@", env!("CARGO_PKG_VERSION"))
}

fn init() -> Result<()> {
    use log::LevelFilter::*;

    std::env::set_var(
        "RUST_BACKTRACE",
        if cfg!(debug_assertions) { "full" } else { "0" },
    );

    if color_eyre::config::HookBuilder::blank()
        .display_env_section(false)
        .panic_section(format!(
            "Report the Crash: {}",
            concat!(env!("CARGO_PKG_REPOSITORY"), "/issues/new").green()
        ))
        .install()
        .is_err()
    {
        log::error!(target: "poodio::init", "Failed to install error hooks");
    }
    simple_logger::SimpleLogger::new()
        .with_colors(true)
        .with_level(if cfg!(debug_assertions) { Info } else { Warn })
        .env()
        .init()?;
    log::info!(target: "poodio::init", "Hi");

    Ok(())
}
