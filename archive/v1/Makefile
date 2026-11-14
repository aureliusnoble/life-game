.PHONY: dev build test lint typecheck migrate clean

# Start both server and client in watch mode
dev:
	pnpm dev

# Build all packages
build:
	pnpm build

# Run all tests
test:
	pnpm test

# Run linter
lint:
	pnpm lint

# Run TypeScript type checking
typecheck:
	pnpm typecheck

# Push Supabase migrations to the remote project
migrate:
	supabase db push

# Clean build artifacts
clean:
	rm -rf packages/shared/dist packages/server/dist packages/client/dist
