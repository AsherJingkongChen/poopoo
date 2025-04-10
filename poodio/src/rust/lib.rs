#![doc = include_str!("../../README.md")]
#![deny(missing_docs)]

pub use clap::{builder::styling, Parser};
pub use color_eyre::Result;

/// After help message.
pub const AFTER_HELP: &str = "See 'https://docs.rs/poodio' for more information.";
/// Help message template.
pub const HELP_TEMPLATE: &str = "{about}\n\n{usage-heading} {usage}\n\n{all-args}{after-help}";
/// Styles for the command line interface.
pub const STYLES: styling::Styles = styling::Styles::styled()
    .header(styling::AnsiColor::Green.on_default().bold())
    .usage(styling::AnsiColor::Green.on_default().bold())
    .literal(styling::AnsiColor::Cyan.on_default().bold())
    .placeholder(styling::AnsiColor::Cyan.on_default())
    .error(styling::AnsiColor::Red.on_default().bold())
    .invalid(styling::AnsiColor::Yellow.on_default().bold())
    .valid(styling::AnsiColor::Cyan.on_default().bold());

#[derive(Clone, Debug, Parser, PartialEq)]
#[command(
    after_help = AFTER_HELP,
    disable_version_flag = true,
    help_template = HELP_TEMPLATE,
    styles = STYLES,
    version = env!("CARGO_PKG_VERSION"),
)]
/// Poodio farts poo poo audio
pub struct Arguments {
    /// Print version
    #[arg(action = clap::ArgAction::Version, global = true, long, short)]
    pub version: (),
}

/// Initializes the program
pub fn init() -> Result<()> {
    color_eyre::install()?;
    std::env::set_var("RUST_BACKTRACE", "full");
    pretty_env_logger::formatted_timed_builder()
        .parse_env("LOG")
        .try_init()?;
    Ok(())
}

// use napi_derive::napi;

// /// A simple greeting message.
// #[napi]
// pub fn greeting() -> &'static str {
//     "Greetings from poodio!"
// }

// /// Program entry point
// #[napi]
// pub fn main() {
//     println!("{}", greeting());
// }
