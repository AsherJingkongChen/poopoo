mod poodio

check-fix: outdated-fix
    npx prettier --write .
    cargo fmt --all
    cargo clippy --all-features --allow-dirty --allow-staged --fix

check: outdated
    npx prettier --check .
    cargo fmt --all --check
    cargo clippy --all-features --locked -- -D warnings

# clean-*
clean: clean-build clean-cargo clean-npm

clean-build:
    rm -rf poodio/dist/

clean-cargo:
    rm -rf target/

clean-npm:
    rm -rf node_modules/

outdated:
    cargo outdated --exit-code 1 --workspace
    npm outdated --all

outdated-fix:
    cargo update
    npm update --ignore-scripts --omit optional

# prepare-*
prepare: prepare-npm

prepare-npm:
    npm ci --ignore-scripts --omit optional --no-audit --no-fund

