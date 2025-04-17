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

clean: clean-cargo clean-dist clean-npm clean-pip

clean-cargo:
    rm -rf 'target/'

clean-dist:
    rm -rf 'poodio/dist/'

clean-npm:
    rm -rf 'node_modules/'

clean-pip:
    rm -rf '.ruff_cache/' '.venv/'

prepare: prepare-npm prepare-pip tools

prepare-npm:
    npm ci

prepare-pip:
    uv sync --locked

tools:
    @echo "node: $(node --print 'p=process;`${p.arch}-${p.platform}-${p.version}`')"
    @echo "python: $(uv run --no-sync python -c "import sys as s,sysconfig as c;print(f'{s.implementation.cache_tag}-{c.get_platform()}')")"
    @echo "rust: $(rustup show active-toolchain)"

update: update-cargo update-npm update-pip tools

update-cargo:
    cargo update --verbose

update-npm:
    npm update

update-pip:
    uv lock --upgrade
    just prepare-pip
