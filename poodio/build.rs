use std::env::var;

fn main() {
    #[cfg(feature = "bind-napi")]
    {
        napi_build::setup();
    }
    #[cfg(feature = "bind-pyo3")]
    {
        pyo3_build_config::add_extension_module_link_args();
    }
    println!("cargo:rustc-env=TARGET={}", var("TARGET").unwrap());
}
