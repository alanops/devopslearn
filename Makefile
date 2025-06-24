.PHONY: help install dev build start stop clean test lint scenario-build

help:
	@echo "DevOps Learning Platform - Available commands:"
	@echo "  make install        - Install dependencies"
	@echo "  make dev           - Start development environment"
	@echo "  make build         - Build production images"
	@echo "  make start         - Start production environment"
	@echo "  make stop          - Stop all services"
	@echo "  make clean         - Clean up containers and volumes"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Run linting"
	@echo "  make scenario-build - Build all scenario images"

install:
	npm install
	cd src/server && npm install

dev:
	docker-compose up -d
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:3001"

build:
	docker-compose build
	$(MAKE) scenario-build

start:
	docker-compose up -d --build

stop:
	docker-compose down

clean:
	docker-compose down -v
	docker rmi $$(docker images -q 'devopslearn/*') 2>/dev/null || true

test:
	npm test
	cd src/server && npm test

lint:
	npm run lint
	npm run typecheck

scenario-build:
	@echo "Building scenario base image..."
	docker build -t devopslearn/scenario-base:latest -f docker/Dockerfile.scenario-base .
	@echo "Building Keycloak CrashLoop scenario..."
	docker build -t devopslearn/scenario-keycloak-crashloop:latest -f scenarios/kubernetes/keycloak-crashloop/Dockerfile scenarios/kubernetes/keycloak-crashloop/
	@echo "Scenario images built successfully!"

logs:
	docker-compose logs -f

ps:
	docker-compose ps