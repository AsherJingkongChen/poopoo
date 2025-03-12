# What does poodio do?

[![Crates](https://img.shields.io/crates/v/poodio?style=for-the-badge&label=CRATES&logo=docs.rs&logoColor=%23fc3&labelColor=%23333&color=%234c1)](https://docs.rs/poodio)
[![License](https://img.shields.io/crates/l/poodio?style=for-the-badge&label=LICENSE&logo=opensourceinitiative&logoColor=%23fff&labelColor=%23333&color=%234a3)](https://docs.rs/crate/poodio/latest/source/LICENSE)
[![Issues](https://img.shields.io/github/issues/AsherJingkongChen/poopoo?style=for-the-badge&label=ISSUES&logo=github&logoColor=%23fff&labelColor=%23333&color=%23484)](https://github.com/AsherJingkongChen/poopoo/issues)

Fart poo poo audio

## Installation

We provide various ways to install `poodio` to your system, so you can pick the one that suits you best.

### Installation - Cargo B(inary) Install

> It is `npx` for `cargo`.

<details><summary><strong>View</strong> pre-requisites</summary>

-   [`rustup` + `cargo`](https://doc.rust-lang.org/cargo/getting-started/installation.html)
-   [`cargo-binstall`](https://github.com/cargo-bins/cargo-binstall?tab=readme-ov-file#installation)
</details>

Install and Run the **latest version** of executable:

```shell
cargo binstall -y poodio && poodio
```

Install and Run the **specific version** (e.g. `0.1.0`) of executable for the lowest latency:

```shell
cargo binstall -y poodio@0.1.0 && poodio
```

### Installation - Build from Source

> It's the most flexible option.

<details><summary><strong>View</strong> pre-requisites</summary>

-   [`git`](https://git-scm.com/downloads)
-   [`rustup` + `cargo`](https://doc.rust-lang.org/cargo/getting-started/installation.html)
</details>

Clone, Install, and Run the **development version** of executable:

```shell
git clone --branch main --depth 1 https://github.com/AsherJingkongChen/poopoo && \
cargo install --path poopoo/poodio && \
poodio
```
