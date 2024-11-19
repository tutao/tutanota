# Node-Mimimi

**M**ini **IM**AP **IM**porter **I**mplementation

A native node module enabling the tuta mail desktop client to import mail from IMAP servers into your tuta account.
It's using [napi-rs](https://napi.rs/docs/introduction/getting-started) for project setup and to generate the bindings.

## Building

napi-rs by default generates a common js module that is supposed to be compatible with ESM named imports, but we had
problems getting it to import in all cases. One solution was found on
the [napi-rs github](https://github.com/napi-rs/napi-rs/issues/1429#issuecomment-1379743978). It works, but requires us
to build like this:

`napi build --platform . --js binding.cjs --dts binding.d.cts`

# Compilation

See https://napi.rs/docs/cross-build/summary

### Setup

1. `apt install clang llvm`

#### Linux (from linux):

1. `rustup target add x86_64-unknown-linux-gnu`

#### Windows (from linux):

1. `rustup target add x86_64-pc-windows-msvc`
2. `cargo install cargo-xwin`

#### MacOS (**only** from MacOS):

1. `rustup target add x86_64-apple-darwin`
2. `rustup target add aarch64-apple-darwin`

