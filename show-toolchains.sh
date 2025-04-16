rustup show active-toolchain
node --print 'let p=process;`${p.arch}-${p.platform}-${p.version}`'
uv python find --verbose 2>&1 | tail -n 2
