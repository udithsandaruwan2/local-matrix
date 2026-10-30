.PHONY: help doctor audit sync hooks check bootstrap test lint-prompt

help:
	@printf 'Agent Project Framework\n\n'
	@printf '  make doctor      Validate structure, skills, links, budgets\n'
	@printf '  make audit       Estimate context tokens\n'
	@printf '  make sync        Regenerate IDE/agent adapters\n'
	@printf '  make hooks       Install the Conventional Commits hook\n'
	@printf '  make check       sync + doctor + audit (CI equivalent)\n'
	@printf '  make lint-prompt FILE=work-order.md\n'
	@printf '  make bootstrap TARGET=../my-app NAME="My App"\n'

doctor:
	./scripts/doctor.sh

audit:
	./scripts/token-audit.sh

sync:
	./scripts/sync-adapters.sh

hooks:
	./scripts/install-hooks.sh

check: sync doctor audit

bootstrap:
	@if [ -z "$(TARGET)" ]; then echo "usage: make bootstrap TARGET=../my-app NAME=\"My App\""; exit 2; fi
	./scripts/bootstrap.sh "$(TARGET)" "$(NAME)"

lint-prompt:
	@if [ -z "$(FILE)" ]; then echo "usage: make lint-prompt FILE=work-order.md"; exit 2; fi
	./scripts/prompt-lint.sh "$(FILE)"

test:
	./scripts/doctor.sh
	./scripts/token-audit.sh --strict
