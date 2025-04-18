use poodio::cli;

fn main() {
    cli::init();
    cli::main(std::env::args().collect());
}
