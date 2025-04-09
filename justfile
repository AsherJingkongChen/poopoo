mod poodio

export NPM_CONFIG_PROGRESS := "false"
export RUST_BACKTRACE := "1"

check:
    npx prettier --check .
    cargo fmt --all --check
    cargo clippy --all-features --locked -- -D warnings

check-fix: update
    npx prettier --write .
    cargo fmt --all
    cargo clippy --all-features --allow-dirty --allow-staged --locked --fix

check-dep:
    cargo audit -D warnings
    cargo outdated --exit-code 1 --workspace
    npm audit
    npm audit signatures
    npm outdated

# clean-*
clean: clean-build clean-cargo clean-npm

clean-build:
    rm -rf poodio/dist/

clean-cargo:
    rm -rf target/

clean-npm:
    rm -rf node_modules/

# prepare-*
prepare: prepare-npm

prepare-npm:
    npm ci --ignore-scripts --no-audit --no-fund --omit optional

update:
    cargo update
    npm update --ignore-scripts --no-audit --no-fund --omit optional
