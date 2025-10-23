# WebProgramming_ExpressRedis_PokemonAPI

An Express server that integrates Redis caching with the PokéAPI to serve Pokémon, move, and item data efficiently. Includes JSON endpoints and simple Handlebars views for browsing.

## Overview

This application demonstrates server-side caching with Redis on top of an Express API that consumes the public PokéAPI. It adds middleware that checks the cache before calling external endpoints, stores successful responses for reuse, and maintains a “recently viewed” list for Pokémon.

## Tech Stack

* **Runtime / Framework:** Node.js, Express.js
* **Cache:** Redis (compatible with `redis-stack-server`)
* **HTTP Client:** Axios
* **Views (optional UI):** express-handlebars
* **Styles / Static Assets:** Express static middleware (`public/`)

## Features

* **Pokémon Endpoints:**

  * `GET /api/pokemon` — list; caches list payload
  * `GET /api/pokemon/:id` — detail; caches by ID; appends to “recently viewed” list
  * `GET /api/pokemon/history` — last 25 viewed Pokémon (most recent first)
* **Move Endpoints:**

  * `GET /api/move` — list; caches list payload
  * `GET /api/move/:id` — detail; caches by ID
* **Item Endpoints:**

  * `GET /api/item` — list; caches list payload
  * `GET /api/item/:id` — detail; caches by ID
* **Caching Middleware:** Per-route middleware checks Redis first and short-circuits responses on hits; on misses, routes fetch from PokéAPI and populate the cache.
* **Error Handling:** Proper status codes for not-found and error cases; JSON responses from middleware when served from cache.
* **Optional UI:** Handlebars layout and views for quick navigation and human-readable JSON (`{{json ...}}` helper).

## File Structure

```text
WebProgramming_ExpressRedis_PokemonAPI/      # project root
├─ app.js                          # Express app init, Redis client, view engine, route wiring
├─ package.json                    # project metadata, deps, npm scripts
├─ routes/                         # API routes and per-route middleware
│  ├─ index.js                     # mounts /api/pokemon, /api/move, /api/item
│  ├─ pokemonRoutes.js             # /api/pokemon, /api/pokemon/:id, /api/pokemon/history
│  ├─ moveRoutes.js                # /api/move, /api/move/:id
│  └─ itemRoutes.js                # /api/item, /api/item/:id
├─ views/                          # Handlebars templates (optional UI)
│  ├─ layouts/
│  │  └─ main.handlebars           # base layout with nav; includes {{{body}}}
│  └─ item.handlebars              # item detail page (renders JSON via helper)
├─ public/                         # static assets
│  └─ styles.css                   # basic styling for optional UI
└─ README.md                       # this file
```

## Setup Instructions

```bash
# 1) Clone
git clone <your-repo-url> WebProgramming_ExpressRedis_PokemonAPI
cd WebProgramming_ExpressRedis_PokemonAPI

# 2) Install Node dependencies
npm install

# 3) Start Redis locally
#    Option A (native): ensure redis-server is running on localhost:6379
#    Option B (redis-stack-server): install & run per vendor docs
#    Option C (Docker):
#      docker run -p 6379:6379 --name redis -d redis/redis-stack-server:latest

# 4) Configure environment (optional)
# By default the client connects to localhost:6379 (no URL set).
# To override, set REDIS_URL (supported by node-redis):
# export REDIS_URL=redis://localhost:6379

# 5) Run the server (default port 3000)
npm start
# Server: http://localhost:3000

# 6) Exercise endpoints (examples)
# Lists:
#   curl http://localhost:3000/api/pokemon
#   curl http://localhost:3000/api/move
#   curl http://localhost:3000/api/item
# Details:
#   curl http://localhost:3000/api/pokemon/1
#   curl http://localhost:3000/api/move/1
#   curl http://localhost:3000/api/item/1
# History:
#   curl http://localhost:3000/api/pokemon/history
```

## Notes

* **Cache Keys:**

  * Lists use fixed keys (e.g., `pokemonHomepage`, `moveHomepage`, `itemHomepage`).
  * Details use the resource ID as the key for quick lookups (e.g., `1`, `2`, …) under each route.
* **History List:**

  * Uses Redis list ops (`LPUSH`, `LRANGE`) to maintain the 25 most recently viewed Pokémon.
  * Insert occurs for both cache hits (middleware) and misses (route after fetch).
* **Middleware Behavior:**

  * On hit: immediately `res.json(...)` (or render prebuilt HTML if using views) and append to history where applicable.
  * On miss: `next()` to route, fetch from PokéAPI (`https://pokeapi.co/api/v2/...`), validate, cache, respond.
* **Status Codes:**

  * `404` for invalid IDs not present in the upstream API.
  * `200` for successful cache hits and fresh fetches.
  * `500` for unexpected server errors.
* **View Layer (Optional):**

  * `express-handlebars` is configured with a `json` helper to pretty-print API payloads in templates.
  * The UI is a convenience; routes still return JSON as required by the assignment.
* **Extensibility:**

  * Add TTLs if desired (e.g., `client.set(key, value, { EX: seconds })`).
  * Introduce namespaced keys (e.g., `pokemon:id:1`) to avoid collisions across resource types.

Author: Connor Durkin
