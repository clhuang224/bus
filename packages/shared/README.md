# Shared Package

This package is reserved for shared contracts between workspaces.

## Intended Scope

Good fits:

- API request and response DTOs
- domain enums shared by frontend and backend
- small pure type helpers
- stable interfaces that describe app-owned API contracts

Avoid putting these here:

- React components
- Redux or RTK Query code
- NestJS services or controllers
- Prisma models as direct frontend contracts
- i18n copy
- localStorage helpers
- backend sync logic

The shared package should stay small and act as a contract layer, not a general utility bucket.
