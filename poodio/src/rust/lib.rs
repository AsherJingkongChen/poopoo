#![deny(missing_docs)]
#![doc = include_str!("../../README.md")]

use napi_derive::napi;

/// A simple greeting message.
#[napi]
pub fn greeting() -> &'static str {
    "Greetings from poodio!"
}

/// Program entry point
#[napi]
pub fn main() {
    println!("{}", greeting());
}
