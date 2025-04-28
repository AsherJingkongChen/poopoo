//! Command Line Interface (CLI) for [`poodio`].
//!
//! ---
//!
//! [`poodio`]: https://docs.rs/poodio

use crate::*;
use clap::{
    builder::styling::{AnsiColor, Styles},
    Parser,
};
use color_eyre::{owo_colors::OwoColorize, Report};
use err::Error::Exit;
use std::{
    ffi::OsString,
    io::{self, Write},
};

#[cfg(feature = "bind-napi")]
use napi_derive::napi;
#[cfg(feature = "bind-pyo3")]
use {pyo3::pyfunction as pyfn, pyo3_stub_gen::derive::gen_stub_pyfunction as pyfn_stub};

/// CLI arguments parser.
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
pub struct Arguments {}

/// CLI initialization function.
///
/// ## Details
///
/// It initializes the reporters before the CLI [`main`] function.
///
/// ---
///
/// [`main`]: https://docs.rs/poodio/latest/poodio/cli/fn.main.html
pub fn init() {
    use log::LevelFilter::*;

    const CRASH_REPORT_URL: &str = concat!(
        env!("CARGO_PKG_REPOSITORY"),
        "/issues/new?template=problem.md"
    );

    color_eyre::config::HookBuilder::default()
        .display_env_section(cfg!(debug_assertions))
        .panic_section(format!("Report the crash: {}", CRASH_REPORT_URL.green()))
        .install()
        .ok();

    simple_logger::SimpleLogger::new()
        .with_colors(true)
        .with_level(if cfg!(debug_assertions) { Debug } else { Warn })
        .env()
        .init()
        .ok();
    log::debug!(target: "poodio::cli::init", "Ok");
}

/// CLI main function.
///
/// ## Details
///
/// It should be called after [`init`].
///
/// ---
///
/// [`init`]: https://docs.rs/poodio/latest/poodio/cli/fn.init.html
#[cfg_attr(feature = "bind-pyo3", pyfn, pyfn_stub)]
#[cfg_attr(feature = "bind-napi", napi)]
pub fn main() {
    let args = std::env::args_os();
    #[cfg(any(feature = "bind-napi", feature = "bind-pyo3"))]
    let args = args.skip(1);

    let exit_code = try_main(args).unwrap_or_else(|e| {
        anstream::AutoStream::auto(io::stderr().lock())
            .write_all(format!("Error: {e:?}\n").as_bytes())
            .map_or(0xFF, |_| 0x01)
    });
    std::process::exit(exit_code);
}

/// The version tag for [`poodio`].
///
/// ---
///
/// [`poodio`]: https://docs.rs/poodio
#[cfg_attr(feature = "bind-pyo3", pyfn, pyfn_stub)]
#[cfg_attr(feature = "bind-napi", napi)]
pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

fn try_main<I, T>(args: I) -> Result<i32, Report>
where
    I: IntoIterator<Item = T>,
    T: Into<OsString> + Clone,
{
    let _args = match Arguments::try_parse_from(args).map_err(|e| match e.kind() {
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
