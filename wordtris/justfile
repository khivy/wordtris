set shell := ["bash", "-uc"]

default:
    just --list

fmt:
    deno fmt

check:
    deno fmt --check
    deno lint
    bun tsc

alias c := check

build:
    bun bun

alias b := build

run:
    bun dev

alias r := run

test:
    bun test/cellTest.ts

alias t := test
