mod poodio

audit:
    cargo audit -D warnings
    cargo outdated --exit-code 1 --workspace
    npm audit
    npm audit signatures
    npm outdated

check:
    npx prettier --check .
    cargo fmt --all --check
    cargo clippy --all-features --locked -- -D warnings

check-fix:
    npx prettier --write .
    cargo fmt --all
    cargo clippy --all-features --allow-dirty --allow-staged --fix

# + clean-*
clean: clean-build clean-cargo clean-npm

clean-build:
    rm -rf poodio/dist/

clean-cargo:
    rm -rf target/

clean-npm:
    rm -rf node_modules/

# + prepare-*
prepare: prepare-npm

prepare-npm:
    npm ci

update:
    cargo update
    npm update
