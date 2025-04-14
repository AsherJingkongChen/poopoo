mod poodio

audit:
    cargo audit -D warnings
    cargo outdated --exit-code 1 --workspace
    npm audit
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
clean: clean-cargo clean-dist clean-npm

clean-cargo:
    rm -rf target/

clean-dist:
    rm -rf poodio/dist/

clean-npm:
    rm -rf node_modules/

prepare:
    npm ci --verbose

update:
    cargo update
    npm update
