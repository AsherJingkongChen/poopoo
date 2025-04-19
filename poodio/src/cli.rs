//! Command Line Interface (CLI) for [`poodio`](crate)

use clap::{
    Parser,
    builder::styling::{AnsiColor, Styles},
};
use color_eyre::{Result, owo_colors::OwoColorize};
use std::{
    env,
    io::{Write, stderr},
    process::exit,
};

#[cfg(feature = "bind-napi")]
use napi_derive::napi;

#[cfg(feature = "bind-pyo3")]
use pyo3::pyfunction as pyfn;

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
struct Arguments {}

/// Command Line Interface (CLI) initializer for [`poodio`](https://docs.rs/poodio).
#[cfg_attr(feature = "bind-pyo3", pyfn)]
#[cfg_attr(feature = "bind-napi", napi)]
pub fn init() {
    use log::LevelFilter::*;

    color_eyre::config::HookBuilder::default()
        .display_env_section(cfg!(debug_assertions))
        .panic_section(format!(
            "Report the Crash: {}",
            concat!(env!("CARGO_PKG_REPOSITORY"), "/issues/new").green()
        ))
        .install()
        .ok();
    simple_logger::SimpleLogger::new()
        .with_colors(true)
        .with_level(if cfg!(debug_assertions) { Info } else { Warn })
        .env()
        .init()
        .ok();
    log::info!(target: "poodio::init", "Hi");
}

/// Command Line Interface (CLI) main function for [`poodio`](https://docs.rs/poodio).
///
/// ## Details
///
/// It does not initialize, use `init` instead.
#[cfg_attr(feature = "bind-pyo3", pyfn)]
#[cfg_attr(feature = "bind-napi", napi)]
pub fn main(argv: Vec<String>) {
    try_main(argv).unwrap_or_else(|e| {
        anstream::AutoStream::auto(stderr().lock())
            .write_all(format!("Error: {e:?}\n").as_bytes())
            .expect("Failed to report error to stderr");
        exit(1)
    })
}

/// See [`main`] for details.
fn try_main(argv: Vec<String>) -> Result<()> {
    let _args = Arguments::try_parse_from(argv).map_err(|parse_err| {
        match parse_err.kind() {
            clap::error::ErrorKind::DisplayVersion => println!("{}", version()),
            _ => {
                if let Err(e) = parse_err.print() {
                    return e;
                }
            },
        };
        exit(parse_err.exit_code())
    })?;

    Ok(())
}

/// Version tag for [`poodio`](https://docs.rs/poodio).
#[cfg_attr(feature = "bind-pyo3", pyfn)]
#[cfg_attr(feature = "bind-napi", napi)]
pub fn version() -> String {
    let name = env!("CARGO_PKG_NAME");
    let version = env!("CARGO_PKG_VERSION");
    format!("{name}@{version}")
}
