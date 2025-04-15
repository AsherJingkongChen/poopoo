mod poodio

export RUFF_NO_CACHE := 'true'

audit:
    cargo audit -D warnings
    cargo outdated --exit-code 1 --workspace
    npm audit
    npm outdated
    uv lock --check
    uv sync --check
    uv run pip-audit --skip-editable --progress-spinner off

audit-fix: update

check:
    cargo fmt --all --check
    cargo clippy --all-features --locked -- -D warnings
    npx prettier --check .
    uv run ruff check
    uv run ruff format --check

check-fix:
    cargo fmt --all
    cargo clippy --all-features --allow-dirty --allow-staged --fix
    npx prettier --write .
    uv run ruff check --fix
    uv run ruff format

clean: clean-cargo clean-dist clean-npm clean-uv

clean-cargo:
    rm -rf 'target/'

clean-dist:
    rm -rf 'poodio/dist/'

clean-npm:
    rm -rf 'node_modules/'

clean-uv:
    rm -rf 'poodio.egg-info/' '.venv/'

prepare:
    npm i
    uv sync

update:
    cargo update --verbose
    npm update
    uv lock
