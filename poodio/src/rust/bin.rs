use poodio::*;

fn main() -> Result<()> {
    init()?;
    let _args = parse_args()?;
    Ok(())
}

fn init() -> Result<()> {
    use log::LevelFilter::*;

    #[cfg(debug_assertions)]
    {
        std::env::set_var("RUST_BACKTRACE", "full");
        color_eyre::install()?;
    }
    simple_logger::SimpleLogger::new()
        .with_colors(true)
        .with_level(if cfg!(debug_assertions) { Info } else { Warn })
        .env()
        .init()?;
    log::info!(target: "poodio::init", "Hi");
    Ok(())
}

fn parse_args() -> Result<Arguments> {
    Arguments::try_parse().or_else(|e| {
        match e.kind() {
            clap::error::ErrorKind::DisplayVersion => println!("{}", version()),
            _ => e.print()?,
        };
        std::process::exit(e.exit_code());
    })
}
