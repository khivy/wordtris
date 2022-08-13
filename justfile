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
    bun bun
    ./node_modules.bun > bundle.js

alias b := build

run:
    bun run

alias r := run
