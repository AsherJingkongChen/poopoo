[linux]
prepare: prepare-apt prepare-npm

[macos, windows]
prepare: prepare-npm

[linux]
prepare-apt:
    sudo apt-get update
    sudo apt-get install -y libasound2-dev

prepare-npm:
    npm ci --ignore-scripts --omit optional

lint:
    cargo fmt --all --check
    cargo clippy --locked -- -D warnings
    cargo clippy --all-features --locked -- -D warnings
    npm run lint --workspaces

outdated:
    cargo outdated --exit-code 77 --workspace

check: lint outdated

test:
    # TODO
    exit 4

build-common:
    npm run build --workspaces

build-target TARGET:
    npm run build --workspaces -- --target {{ TARGET }}

clean: clean-build clean-cargo clean-npm

clean-build:
    rm -rf poodio/dist

clean-cargo:
    cargo clean

clean-npm:
    npm prune
    rm -rf node_modules
