mod poodio

export RUFF_NO_CACHE := 'true'
export UV_NO_SYNC := 'true'

# Audit all dependencies.
audit:
    uv lock --check
    npm outdated
    cargo update --locked --verbose
    npm audit
    npm audit signatures
    cargo audit --deny warnings
    uv run pip-audit --progress-spinner off --skip-editable

# Fix all dependencies issues.
audit-fix: update
    npm audit fix --force
    uv run pip-audit --fix --skip-editable

# Run formatting and linting checks.
check:
    uv run ruff format --check
    uv run ruff check
    npx --no prettier -- --check .
    cargo fmt --all --check
    cargo clippy --all-features --all-targets --frozen --workspace

# Automatically fix formatting and linting issues.
check-fix:
    uv run ruff format
    uv run ruff check --fix
    npx --no prettier -- --write .
    cargo fmt --all
    cargo clippy --all-features --all-targets --allow-dirty --allow-staged --fix --workspace
    cargo clippy --all-features --all-targets --frozen --workspace

# Remove all artifacts.
clean: clean-dist clean-npm clean-pip clean-cargo

# Remove cargo build artifacts.
clean-cargo:
    rm -rf 'target/'

# Remove distribution artifacts.
clean-dist:
    rm -rf 'poodio/dist/'

# Remove npm dependencies artifacts.
clean-npm:
    rm -rf 'node_modules/'

# Remove pip dependencies artifacts.
clean-pip:
    rm -rf '.ruff_cache/' '.venv/' 'workspace.egg-info/'

# Prepare all dependencies.
prepare: prepare-pip prepare-npm prepare-cargo

# Prepare cargo dependencies.
prepare-cargo:
    cargo fetch --locked
    @just tool-cargo

# Prepare npm dependencies.
prepare-npm:
    npm ci
    @just tool-npm

# Prepare pip dependencies.
prepare-pip:
    uv sync --locked --quiet
    uv sync --check --color always
    @just tool-pip

# Show all active toolchains.
tool:
    @echo ''
    @just tool-cargo tool-npm tool-pip

# Show active cargo toolchain.
tool-cargo:
    @echo "[TOOL] cargo: rust-$(rustup show active-toolchain | cut -f1 -d' ')"

# Show active npm toolchain.
tool-npm:
    @echo "[TOOL] npm: node-$(node -r tell-libc -p \
        'p=process;p.version+`-`+p.platform+`-`+p.arch+(p.libc||``)')"

# Show active pip toolchain.
tool-pip:
    @echo "[TOOL] pip:" $(uv run --quiet python -c \
        'import sys as s,sysconfig as c;print(f"{s.implementation.cache_tag}-{c.get_platform()}")')

# Update all dependencies.
update: update-cargo update-pip update-npm

# Update cargo dependencies.
update-cargo:
    cargo update --verbose
    @just tool-cargo

# Update npm dependencies.
update-npm:
    npm update
    @just tool-npm

# Update pip dependencies.
update-pip:
    uv lock --upgrade
    uv sync --locked --quiet
    @just tool-pip
