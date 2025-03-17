mod poodio

# outdated, lint
check: outdated lint

# clean-*
clean: clean-artifact clean-cargo clean-npm

clean-artifact:
    rm -rf poodio/dist/

clean-cargo:
    cargo clean

clean-npm:
    rm -rf node_modules/ package-lock.json

lint-fix:
    cargo fmt --all
    cargo clippy --all-features --allow-dirty --allow-staged --fix --locked
    npm exec prettier -- --write .

lint:
    cargo fmt --all --check
    cargo clippy --all-features --locked -- -D warnings
    npm exec prettier -- --check .

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
    npm i --ignore-scripts --no-package-lock --omit optional

# TODO
test:
    exit 4
