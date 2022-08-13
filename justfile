set shell := ["bash", "-uc"]

default:
    just --list

fmt:
    deno fmt

check:
    deno fmt --check
    bun tsc

alias c := check

build:
    bun bun src/index.tsx

alias b := build

run:
    bun run

alias r := run
