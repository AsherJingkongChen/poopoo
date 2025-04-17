echo "rustup: $(rustup show active-toolchain)"
echo "node: $(node --print 'let p=process;`${p.arch}-${p.platform}-${p.version}`')"
echo "python (uv): $(uv python find --verbose 2>&1 | tail -n 2 | grep 'Found \`.*\` at' | awk -F'\`' '{print $2}')"
