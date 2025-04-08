mod poodio

check-fix:
    cargo fmt --all
    cargo clippy --all-features --allow-dirty --allow-staged --fix
    npm exec prettier -- --write .

check:
    cargo fmt --all --check
    cargo clippy --all-features --locked -- -D warnings
    npm exec prettier -- --check .

# clean-*
clean: clean-artifact clean-cargo clean-npm

clean-artifact:
    rm -rf poodio/dist/

clean-cargo:
    cargo clean

clean-npm:
    rm -rf node_modules/

outdated:
    cargo outdated --exit-code 4 --workspace
    npm outdated --all

# prepare-*
[linux]
prepare: prepare-apt prepare-npm

# prepare-*
[macos, windows]
prepare: prepare-npm

[linux]
prepare-apt:
    sudo apt-get update
    sudo apt-get install -y libasound2-dev

prepare-npm:
    npm ci --ignore-scripts --omit optional

# TODO
test:
    exit 4

update:
    cargo update
    npm update --ignore-scripts --omit optional
