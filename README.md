# foodie-frontend

pnpm + Turborepo workspace for Foodie client applications.

```
foodie-frontend/
  apps/
    customer/      # Expo — foodie-customer
    restaurant/    # Expo — foodie-restaurant
    delivery/      # Expo — foodie-delivery
    admin/         # Next.js — foodie-admin
  packages/
    shared-rn/     # foodie-shared-rn
    shared-web/    # foodie-shared-web
  tooling/
  docs/
  package.json
  pnpm-workspace.yaml
  turbo.json
```

## Setup

```bash
cd foodie-frontend
pnpm install
pnpm --filter foodie-shared-rn build
pnpm --filter foodie-shared-web build
```

## Run

```bash
pnpm dev:customer      # Expo
pnpm web:customer      # Expo web
pnpm dev:admin         # Next.js
```

Canonical product docs: `../documentation/`.
