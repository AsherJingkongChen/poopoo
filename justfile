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

prepare: prepare-pip prepare-npm prepare-cargo

prepare-cargo:
    cargo update --locked --verbose
    @just tool-cargo

prepare-npm:
    npm ci
    @just tool-npm

prepare-pip:
    uv sync --locked --quiet
    @uv sync --check --color always 2>&1 | tail -n 2
    @just tool-pip

tool: tool-cargo tool-npm tool-pip

tool-cargo:
    @echo "cargo (rust): $(rustup show active-toolchain)"

tool-npm:
    @echo "npm (node): $(node -p 'p=process;`${p.version}-${p.platform}-${p.arch}`')"

tool-pip:
    @echo "pip (python): $(uv run --no-sync --quiet python -c \
        "import sys as s,sysconfig as c;print(f'{s.implementation.cache_tag}-{c.get_platform()}')")"

update: update-pip update-npm update-cargo

update-cargo:
    cargo update --verbose
    @just tool-cargo

update-npm:
    npm update
    @just tool-npm

update-pip:
    uv lock --upgrade
    @just tool-pip
