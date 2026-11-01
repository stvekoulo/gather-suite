# Account and sync

Gather remains a local app: the account is optional and everything works offline.

## How it works

- **Account:** Neon Auth (email and password), called directly by the app.
- **Data:** one row per item in `public.gather_items`, read and written through Neon's Data API with the user's token. Schema: [`cloud/schema.sql`](../cloud/schema.sql).
- **Account separation:** only through this table's RLS rules. Any table added later must have its own rules before it is exposed.
- **Frequency:** 10 seconds after a change, when returning to the app, when the network comes back, and otherwise every 5 minutes. Polling more often would stop the free database from going to sleep.

## Setup

Enable the Data API on the branch first, because it creates the `authenticated` role and refuses to run if one already exists. Then apply `cloud/schema.sql`.

## What syncs

Notes, tasks, events, finances, invoices, time, clients, spreadsheets, presentations, written documents, whiteboard, profile, preferences, categories and spaces.

These stay on the device: imported files and attachments (their details sync, not their content), the timer, notifications and PDF history. An item over 256 KB also stays local, and the Account screen says so.

## Conflicts

The last save wins, item by item, based on the server clock. The first time a device syncs, the account is the reference, and the device's other local items are added to it.

## Security rules

- `DATABASE_URL` and `DATABASE_URL_POOLED` give full access: **never put them in the app or the repository**. They are only used to apply `cloud/schema.sql` from an admin machine.
- The two URLs in `src/modules/cloud/auth.ts` are public by nature.
- Origins allowed by Neon Auth: `http://tauri.localhost`, `https://tauri.localhost`, `tauri://localhost`. `localhost` stays accepted for development.

## Not available yet

Google sign-in (it needs a return from the system browser to the app) and file sync.
