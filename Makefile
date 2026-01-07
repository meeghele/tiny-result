# Copyright (c) 2025 Michele Tavella <meeghele@proton.me>
# Licensed under the MIT License. See LICENSE file for details.

default: all

.PHONY: all
all: install check test build examples

.PHONY: install
install:
	bun install

.PHONY: build
build:
	bun run build

.PHONY: dev
dev:
	bun run dev

.PHONY: test
test:
	bun run test

.PHONY: lint
lint:
	bun run lint

.PHONY: check
check:
	bun run check

.PHONY: format-check
format-check:
	bun run format:check

.PHONY: format
format:
	bun run format

.PHONY: clean
clean:
	bun run clean
	rm -rf node_modules
	rm -rf docs
	rm -rf coverage

.PHONY: examples
examples:
	bun run example:basic
	bun run example:metadata
	bun run example:advanced

.PHONY: ci
ci:
	act

.PHONY: publish
publish:
	bun publish --access public
