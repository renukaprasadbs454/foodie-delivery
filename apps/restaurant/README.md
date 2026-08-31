# GreenFork Partner Console

Frontend-only restaurant partner panel using realistic in-memory data. Run with `yarn start`.

Demo login accepts any values and stores a local session. Overview, order queue, menu stock management, analytics, offers, payouts, settings, responsive navigation, and a simulated live-order event are included.

`src/services/index.js` is the backend swap point. Replace each mock adapter while preserving its domain contract; no component needs to import mock data directly.
