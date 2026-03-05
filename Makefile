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

# Apply Supabase migrations (requires local Supabase running)
migrate:
	supabase db reset

# Clean build artifacts
clean:
	rm -rf packages/shared/dist packages/server/dist packages/client/dist
