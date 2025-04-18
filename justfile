mod poodio

export RUFF_NO_CACHE := 'true'

audit:
    uv lock --check
    npm outdated
    cargo update --locked
    npm audit
    npm audit signatures
    cargo audit --deny warnings
    uv run --no-sync pip-audit --progress-spinner off --skip-editable

audit-fix: update

check:
    uv run --no-sync ruff format --check
    uv run --no-sync ruff check
    npx prettier --check .
    cargo fmt --all --check
    cargo clippy --all-features --locked -- --forbid warnings

check-fix:
    uv run --no-sync ruff format
    uv run --no-sync ruff check --fix
    npx prettier --write .
    cargo fmt --all
    cargo clippy --all-features --allow-dirty --allow-staged --fix
    cargo clippy --all-features --locked -- --forbid warnings 2> /dev/null

clean: clean-cargo clean-dist clean-npm clean-pip

clean-cargo:
    rm -rf 'target/'

clean-dist:
    rm -rf 'poodio/dist/'

clean-npm:
    rm -rf 'node_modules/'

clean-pip:
    rm -rf '.ruff_cache/' '.venv/' 'workspace.egg-info/'

prepare: prepare-pip prepare-npm prepare-cargo

prepare-cargo:
    cargo update --locked --verbose
    @just tool-cargo

prepare-npm:
    npm ci
    @just tool-npm

prepare-pip:
    uv sync --locked --quiet || uv sync --check --color always
    @just tool-pip

tool:
    @echo ''
    @just tool-cargo tool-npm tool-pip

tool-cargo:
    @echo "[TOOL] cargo: rust-$(rustup show active-toolchain | cut -f1 -d' ')"

tool-npm:
    @echo "[TOOL] npm: node-$(node -r tell-libc -p \
        'p=process;p.version+`-`+p.platform+`-`+p.arch+(p.libc||``)')"

tool-pip:
    @echo "[TOOL] pip:" $(uv run --no-sync --quiet python -c \
        'import sys as s,sysconfig as c;print(f"{s.implementation.cache_tag}-{c.get_platform()}")')

update: update-pip update-npm update-cargo

update-cargo:
    cargo update --verbose
    @just tool-cargo

update-npm:
    npm update
    @just tool-npm

update-pip:
    uv lock --upgrade
    uv sync --locked 2> /dev/null
    @just tool-pip
