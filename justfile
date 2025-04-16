mod poodio

export RUFF_NO_CACHE := 'true'

audit:
    uv lock --check
    npm outdated
    cargo outdated --exit-code 1 --workspace
    npm audit
    cargo audit -D warnings
    uv run --no-sync pip-audit --progress-spinner off --skip-editable

audit-fix: update

check:
    uv run --no-sync ruff format --check
    uv run --no-sync ruff check
    npx prettier --check .
    cargo fmt --all --check
    cargo clippy --all-features --locked -- -D warnings

check-fix:
    cargo fmt --all
    uv run --no-sync ruff format
    uv run --no-sync ruff check --fix
    npx prettier --write .
    cargo clippy --all-features --allow-dirty --allow-staged --fix

clean: clean-cargo clean-dist clean-npm clean-uv

clean-cargo:
    rm -rf 'target/'

clean-dist:
    rm -rf 'poodio/dist/'

clean-npm:
    rm -rf 'node_modules/'

clean-uv:
    rm -rf '.venv/'

prepare:
    uv sync --no-install-workspace --locked
    npm i

update:
    npm update
    uv lock --upgrade
    cargo update --verbose
