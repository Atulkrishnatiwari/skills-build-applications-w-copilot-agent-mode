# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- **Implementation order:** Complete the Data tier first, then the Logic tier, then the Presentation tier. Verify backend and frontend builds last, after all three tiers are implemented and tested.
- Data tier decision: Keep persistence and data rules in the Mongoose models and seed script. Define the required fields and validation for users, teams, activities, and workouts there; keep MongoDB on port `27017`.
- Logic tier decision: Keep API behavior in the Express/TypeScript routes and services. Validate requests and references before persistence, return deliberate 4xx responses for invalid or unknown input, and compute activity points, leaderboard totals/ranks, and user-specific workout suggestions in this tier. Keep the API on port `8000`.
- Presentation tier decision: Keep page rendering and user interaction in the React frontend. Pages consume the Express API through the shared API client in `octofit-tracker/frontend/src`, using relative `/api` paths that Vite proxies to `http://localhost:8000` (or the configured `VITE_API_BASE_URL`). Keep request and response handling in that shared client rather than duplicating it in page components. While requests are pending, show an announced loading state; when successful responses contain no records or suggestions, show a meaningful empty state; when a request fails, show an accessible error alert; and on success, render the returned backend data. Display activities, teams and their members, leaderboard entries with rank and total points, and workout suggestions with their focus and reason in the corresponding pages. Keep Vite on port `5173`.
- Activity tracking approach: List and create activities through the API. Require valid IDs for an existing user and team, and persist the submitted activity fields with computed points and an occurrence date.
- Team management approach: List and create teams through the API, preserving their name, mascot, and members; reject a missing name with `400`.
- Leaderboard approach: Aggregate activity points by team, sort highest total first, and return each team's name, total, and 1-based rank.
- Workout suggestions approach: Match the requested email to a seeded user and use their goal or recent activity to choose a relevant first suggestion with an explanatory reason; return a deliberate 4xx when no user matches.

## Test plan

### Current baseline

- **Data:** 4 of 5 tests fail. Empty user, team, activity, and workout models do not report the required-field validation errors; the seed-data test passes.
- **Logic/API:** 4 of 4 tests fail. Invalid activity and nameless-team requests return `501` instead of `400`; the leaderboard returns no entries instead of totals ordered by points; and the first workout suggestion does not match the user's expected activity pattern.
- **Presentation:** 15 of 15 tests fail. Expected activity/team/leaderboard content is not rendered, the workout request does not target a specific user as expected, and pages fail loading-state, meaningful-empty-state, and accessible-API-error expectations across activities, teams, leaderboard, and workouts.

### Implementation order and commands

- **After the Data tier:** `npm run test:data --prefix octofit-tracker/backend`
- **After the Logic tier:** `npm run test:api --prefix octofit-tracker/backend`
- **After the Presentation tier:** `npm test --prefix octofit-tracker/frontend`
- **Build verification last:** `npm run build --prefix octofit-tracker/backend` and `npm run build --prefix octofit-tracker/frontend`
