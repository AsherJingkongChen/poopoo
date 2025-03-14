#![deny(missing_docs)]
#![doc = include_str!("../../README.md")]

use napi_derive::napi;

/// Entry point
#[napi]
pub fn main() {
    println!("Hello World from poodio!");
}
