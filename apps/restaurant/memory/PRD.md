# Restaurant Partner Panel PRD

## Original problem statement
Build a production-grade, fully responsive frontend-only Restaurant Partner Panel for food delivery partners, using React and mock services, with live order management, menu management, dashboard, analytics, offers, payouts, settings, responsive layouts, and backend integration points.

## Architecture decisions
- Preserve the provided React/JavaScript starter rather than converting it to TypeScript.
- Use React Router for workspace routes and in-memory state for the current demo session.
- Keep service adapters under `frontend/src/services/index.js` as the backend swap point.
- Use the existing external configuration untouched; this frontend does not call the backend.

## Personas
- Restaurant owner monitoring revenue and restaurant availability.
- Counter staff accepting, rejecting, and progressing live orders.
- Menu manager keeping items and stock accurate during rush hour.

## Core requirements
- Mobile-first responsive workspace with mobile bottom nav, tablet queue/detail layout, and desktop sidebar.
- Mock sign-in and protected workspace session.
- Order queue, filters, selected order detail, accept/reject actions, status visualization, and simulated new-order event.
- Menu categories, stock toggles, out-of-stock visual state, and add-item modal.
- Overview stats, revenue chart, order funnel, analytics, offers, payouts, and settings routes.

## Implemented
- 2026-06-24: Replaced starter screen with GreenFork Partner Console.
- 2026-06-24: Added responsive navigation shell, sign-in, dashboard, orders, menu, analytics, offers, payouts, and settings views.
- 2026-06-24: Added interactive restaurant open/closed toggle, order accept/reject updates, menu stock updates, modal flow, and timed new-order simulation.
- 2026-06-24: Added service integration point, README, reduced-motion CSS, test IDs, and responsive styling.
- 2026-06-24: Added 45-second countdown rings, automatic timeout rejection, synchronized rejected detail feedback, and dynamic new-order counts.
- 2026-06-24: Added owner, manager, and order-taker role controls with navigation and menu-action permissions.
- 2026-06-24: Added promotion builder with active windows, offer publishing, and customer preview cards.
- 2026-06-24: Added visible realtime demo lab with fire-order, disconnect/reconnect, and simulated latency controls.

## Backlog
- P0: Move domain state into TanStack Query-backed service adapters.
- P1: Add persisted menu CRUD, rejection reason flow, optimistic rollback, and backend-backed dev controls.
- P1: Add full analytics, payout statement, and settings forms.
- P2: Add component/unit tests and Playwright responsive coverage.

## Next tasks
1. Extract domain components and mock implementations into the planned folder structure.
2. Add full state-machine validation and service-level failure simulation.
3. Add order history search, countdown auto-reject, and notification/toast feedback.