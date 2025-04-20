//! Command Line Interface (CLI) for [`poodio`].
//!
//! ---
//!
//! [`init`]:   https://docs.rs/poodio/latest/poodio/cli/fn.init.html
//! [`main`]:   https://docs.rs/poodio/latest/poodio/cli/fn.main.html
//! [`poodio`]: https://docs.rs/poodio/latest/poodio/

use crate::*;
use clap::{
    Parser,
    builder::styling::{AnsiColor, Styles},
};
use color_eyre::{Report, owo_colors::OwoColorize};
use err::Error::Exit;
use std::{
    env::args_os,
    ffi::OsString,
    io::{Write, stderr},
    process::exit,
};

#[cfg(feature = "bind-napi")]
use napi_derive::napi;
#[cfg(feature = "bind-pyo3")]
use pyo3::pyfunction as pyfn;

#[derive(Clone, Debug, Parser, PartialEq)]
#[command(
    about = "Poodio farts poo poo audio",
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
/// CLI arguments parser.
pub struct Arguments {}

/// CLI initialization function.
///
/// ## Details
///
/// It initializes the error reporter and logger before the CLI [`main`] function.
///
/// ---
///
/// [`main`]: https://docs.rs/poodio/latest/poodio/cli/fn.main.html
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

/// CLI main function.
///
/// ## Details
///
/// [`main`] should be called after [`init`].
pub fn main<I, T>(argv: I)
where
    I: IntoIterator<Item = T>,
    T: Into<OsString> + Clone,
{
    let exit_code = try_main(argv).unwrap_or_else(|e| {
        anstream::AutoStream::auto(stderr().lock())
            .write_all(format!("Error: {e:?}\n").as_bytes())
            .expect("Failed to report error to stderr");
        1
    });
    exit(exit_code);
}

/// It calls [`main`] with the default CLI arguments.
pub fn main_from_argv_0() {
    main(args_os());
}

/// It calls [`main`] with the default CLI arguments except for the first one.
///
/// ---
///
/// [`main`]: https://docs.rs/poodio/latest/poodio/cli/fn.main.html
#[cfg_attr(feature = "bind-pyo3", pyfn(name = "main"))]
#[cfg_attr(feature = "bind-napi", napi(js_name = "main"))]
pub fn main_from_argv_1() {
    main(args_os().skip(1));
}

/// The version tag for [`poodio`].
#[cfg_attr(feature = "bind-pyo3", pyfn)]
#[cfg_attr(feature = "bind-napi", napi)]
pub fn version() -> String {
    let name = env!("CARGO_PKG_NAME");
    let version = env!("CARGO_PKG_VERSION");
    format!("{name}@{version}")
}

/// CLI main function for [`poodio`].
///
/// ## Details
///
/// It returns the process exit code if [`Ok`] or the error report if [`Err`].
fn try_main<I, T>(argv: I) -> Result<i32, Report>
where
    I: IntoIterator<Item = T>,
    T: Into<OsString> + Clone,
{
    let _args = match Arguments::try_parse_from(argv).map_err(|e| match e.kind() {
        clap::error::ErrorKind::DisplayVersion => {
            println!("{}", version());
            Exit(e.exit_code())
        },
        _ => match e.print() {
            Ok(_) => Exit(e.exit_code()),
            Err(e) => e.into(),
        },
    }) {
        Err(Exit(code)) => return Ok(code),
        Err(e) => return Err(e.into()),
        Ok(v) => v,
    };
    Ok(0)
}
