## Context

~~Node-RED exposes context writes via `PUT /context/{node|flow|global}/:id`.~~

## CONFIRMED: Node-RED Admin API does not support writing context values

Live testing with request logging added to `client.js` confirmed:

- `POST /context/*` → **404** — endpoint does not exist
- `PUT /context/*` → **404** — endpoint does not exist

The Node-RED Admin API context endpoints are **read-only** and **delete-only**:

| Method | Endpoint | Result |
|--------|----------|--------|
| GET | `/context/{scope}/{id}` | List all keys |
| GET | `/context/{scope}/{id}/{var}` | Read one key |
| DELETE | `/context/{scope}/{id}/{var}` | Delete one key |
| POST | `/context/*` | **404 — not supported** |
| PUT | `/context/*` | **404 — not supported** |

Context can only be written from **within a running flow** via `flow.set()`, `node.set()`, or `global.set()` inside a function node.

## Design Decision

**Decision**: Do NOT implement `set-context`. Remove existing implementation.

**Rationale**: The underlying API does not exist. Exposing a tool that silently fails or errors at runtime provides no value and could mislead users. The correct approach for seeding context is to use an inject node + function node within a flow.

## Goals / Non-Goals (revised)

**Goals (dropped):**
- ~~Write a single key-value pair to node, flow, or global context~~

**Non-Goals (still apply):**
- Reading context values (see `get-context`)
- Deleting context values (see `delete-context`)
