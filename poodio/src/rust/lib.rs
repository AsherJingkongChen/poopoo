#![doc = include_str!("../../README.md")]
#![deny(missing_docs)]

pub use clap::Parser;
pub use color_eyre::Result;

use clap::builder::styling::{AnsiColor, Styles};
use color_eyre::owo_colors::OwoColorize;
use napi_derive::napi;

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

/// Program version tag
#[napi]
pub fn version() -> String {
    format!("poodio@{}", env!("CARGO_PKG_VERSION"))
}
