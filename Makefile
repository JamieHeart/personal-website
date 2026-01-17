.PHONY: setup dev test docker-build docker-run db-local db-stop tf-init tf-plan tf-apply deploy

ifneq (,$(wildcard .env))
include .env
export
endif

setup:
	cd web && npm install

dev:
	cd web && npm run dev

test:
	cd web && npm run lint && npm run typecheck

docker-build:
	docker build -t personal-website:local -f web/Dockerfile .

docker-run:
	docker run --rm -p 3000:3000 --env-file web/.env.example \
		-e DYNAMODB_ENDPOINT=http://host.docker.internal:8000 \
		personal-website:local

db-local:
	docker compose up -d dynamodb-local

db-stop:
	docker compose down

tf-init:
	cd infra && terraform init

tf-plan:
	cd infra && terraform plan

tf-apply:
	cd infra && terraform apply

deploy: docker-build tf-apply
