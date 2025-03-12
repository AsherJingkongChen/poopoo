# What does poodio do?

[![Crates](https://img.shields.io/crates/v/poodio?style=for-the-badge&label=CRATES&logo=docs.rs&logoColor=%23fc3&labelColor=%23333&color=%234c1)](https://docs.rs/poodio)
[![License](https://img.shields.io/crates/l/poodio?style=for-the-badge&label=LICENSE&logo=opensourceinitiative&logoColor=%23fff&labelColor=%23333&color=%234a3)](https://docs.rs/crate/poodio/latest/source/LICENSE)

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

### Installation - GitHub Release

> You can download a pre-built executable.

<details><summary><strong>View</strong> screenshots</summary>

![GitHub Release Assets](https://raw.githubusercontent.com/AsherJingkongChen/poopoo/main/poodio/doc/img/readme-screenshot-1.png)

</details>

1. Open the **[tags](https://github.com/AsherJingkongChen/poopoo/tags) page**.
2. Download the **proper asset** (e.g. `poodio-x86_64-pc-windows-msvc.exe`)

    from the **specific release** (e.g. `poodio@0.1.0`).

3. Run the executable:

    ```shell
    ./poodio-x86_64-pc-windows-msvc.exe
    ```

4. Optionally, you can move it to a **directory** in your environment variable **`PATH`** and run it more easily:

    ```shell
    poodio
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
