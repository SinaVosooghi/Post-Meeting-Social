# Makefile for Post-Meeting Social Media Content Generator
# Provides convenient commands for development workflow

.PHONY: help dev-up dev-down dev-logs dev-clean install build test lint format prisma-migrate prisma-studio prisma-reset tunnel

# Default target
help: ## Show this help message
	@echo "Post-Meeting Social Media Content Generator - Development Commands"
	@echo "=================================================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Infrastructure
dev-up: ## Start development infrastructure (PostgreSQL, Redis, etc.)
	@echo "🚀 Starting development infrastructure..."
	docker-compose -f docker-compose.dev.yml up -d postgres redis mailhog minio
	@echo "✅ Development infrastructure started!"
	@echo "📊 Services available:"
	@echo "   - PostgreSQL: localhost:5432"
	@echo "   - Redis: localhost:6379"
	@echo "   - MailHog: http://localhost:8025"
	@echo "   - MinIO Console: http://localhost:9001 (admin/admin)"

dev-down: ## Stop development infrastructure
	@echo "🛑 Stopping development infrastructure..."
	docker-compose -f docker-compose.dev.yml down
	@echo "✅ Development infrastructure stopped!"

dev-logs: ## View logs from development infrastructure
	docker-compose -f docker-compose.dev.yml logs -f

dev-clean: ## Clean development infrastructure (removes volumes)
	@echo "🧹 Cleaning development infrastructure..."
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f
	@echo "✅ Development infrastructure cleaned!"

# Application Setup
install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	yarn install
	@echo "✅ Dependencies installed!"

build: ## Build the application
	@echo "🔨 Building application..."
	yarn build
	@echo "✅ Application built!"

dev: dev-up ## Start development server with infrastructure
	@echo "🚀 Starting development server..."
	yarn dev

# Database Management
prisma-migrate: ## Run Prisma migrations
	@echo "🗃️  Running Prisma migrations..."
	yarn prisma migrate dev
	@echo "✅ Migrations completed!"

prisma-generate: ## Generate Prisma client
	@echo "⚡ Generating Prisma client..."
	yarn prisma generate
	@echo "✅ Prisma client generated!"

prisma-studio: ## Open Prisma Studio
	@echo "🎨 Opening Prisma Studio..."
	yarn prisma studio

prisma-reset: ## Reset database and apply migrations
	@echo "🔄 Resetting database..."
	yarn prisma migrate reset --force
	@echo "✅ Database reset completed!"

prisma-seed: ## Seed the database with sample data
	@echo "🌱 Seeding database..."
	yarn prisma db seed
	@echo "✅ Database seeded!"

# Testing
test: ## Run tests
	@echo "🧪 Running tests..."
	yarn test
	@echo "✅ Tests completed!"

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	yarn test --watch

test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	yarn test --coverage
	@echo "✅ Test coverage report generated!"

# Code Quality
type-sheriff: ## Check for type definitions outside master-interfaces.ts
	@echo "🔍 Checking for type definitions outside master-interfaces.ts..."
	@if grep -rn "^\(export\s\+\)\?\(type\|interface\)\s\+" src | grep -v "master-interfaces.ts" | grep -v "\.backup" | grep -v "src/types/index.ts" | grep -v "src/components/ui/" | grep -q .; then \
		echo "❌ Found type definitions outside master-interfaces.ts:"; \
		grep -rn "^\(export\s\+\)\?\(type\|interface\)\s\+" src | grep -v "master-interfaces.ts" | grep -v "\.backup" | grep -v "src/types/index.ts" | grep -v "src/components/ui/"; \
		exit 1; \
	else \
		echo "✅ All types properly centralized"; \
	fi

lint: type-sheriff ## Run ESLint
	@echo "🔍 Linting code..."
	yarn lint
	@echo "✅ Linting completed!"

lint-fix: ## Fix ESLint issues
	@echo "🔧 Fixing lint issues..."
	yarn lint --fix
	@echo "✅ Lint issues fixed!"

format: ## Format code with Prettier
	@echo "💅 Formatting code..."
	yarn prettier --write .
	@echo "✅ Code formatted!"

type-check: ## Run TypeScript type checking
	@echo "🔍 Type checking..."
	yarn tsc --noEmit
	@echo "✅ Type checking completed!"

# Tunneling (for OAuth development)
tunnel: ## Start ngrok tunnel for OAuth callbacks
	@echo "🌐 Starting ngrok tunnel..."
	docker-compose -f docker-compose.dev.yml --profile tunnel up -d ngrok
	@echo "✅ Ngrok tunnel started!"
	@echo "🔗 Check tunnel URL at: http://localhost:4040"

tunnel-stop: ## Stop ngrok tunnel
	@echo "🛑 Stopping ngrok tunnel..."
	docker-compose -f docker-compose.dev.yml stop ngrok
	@echo "✅ Ngrok tunnel stopped!"

# Deployment
deploy-preview: ## Deploy preview to Vercel
	@echo "🚀 Deploying preview to Vercel..."
	vercel
	@echo "✅ Preview deployed!"

deploy-production: ## Deploy to production
	@echo "🚀 Deploying to production..."
	vercel --prod
	@echo "✅ Production deployment completed!"

# Utility Commands
logs: ## View application logs
	@echo "📋 Viewing application logs..."
	yarn logs

clean: dev-clean ## Clean everything (infrastructure + node_modules)
	@echo "🧹 Cleaning everything..."
	rm -rf node_modules
	rm -rf .next
	rm -rf dist
	rm -rf coverage
	@echo "✅ Everything cleaned!"

setup: install dev-up prisma-generate prisma-migrate ## Complete development setup
	@echo "🎉 Development setup completed!"
	@echo "📝 Next steps:"
	@echo "   1. Copy .env.example to .env and fill in your API keys"
	@echo "   2. Run 'make dev' to start the development server"
	@echo "   3. Visit http://localhost:3000"

# Health Checks
health: ## Check health of all services
	@echo "🏥 Checking service health..."
	@echo "PostgreSQL:" && docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres || echo "❌ PostgreSQL not ready"
	@echo "Redis:" && docker-compose -f docker-compose.dev.yml exec redis redis-cli ping || echo "❌ Redis not ready"
	@echo "✅ Health check completed!"

# Documentation
docs: ## Generate documentation
	@echo "📚 Generating documentation..."
	yarn typedoc
	@echo "✅ Documentation generated!"
