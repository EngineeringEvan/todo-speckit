# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `dev`.

## 1. Authentication & Identity

| Rule ID | Name | Rule / Behavior | Provenance | Enforcement |
|---------|------|-----------------|------------|-------------|
| `AUTH-001` | Username Login | Authentication requires username + password (not email-only). | `FR-001` | `backend/app/controllers/auth.controller.js` |
| `AUTH-002` | Password Hashing | Passwords hashed with bcrypt (`SALT_ROUNDS = 10`); hashes excluded in defaultScope and never returned via API. | `FR-003` | `backend/app/models/user.model.js`, `backend/app/controllers/auth.controller.js` |
| `AUTH-003` | Username Normalization | Usernames are trimmed and stored in lowercase. Uniqueness is case-insensitive. | `FR-001` | `backend/app/models/user.model.js`, `backend/app/controllers/auth.controller.js` |
| `AUTH-004` | Default Role | New users are assigned role `worker` by default. | `FR-007` | `backend/app/models/user.model.js` |
| `AUTH-005` | Request Identity | Authenticated requests resolve user identity from Bearer token to `req.user = { id, role }`. | `FR-008` | `backend/app/authorization/authorization.js` |

## 2. Session Management

| Rule ID | Name | Rule / Behavior | Provenance | Enforcement |
|---------|------|-----------------|------------|-------------|
| `SESS-001` | Session Storage & TTL | Sessions tracked in `sessions` table with JWT token; 24-hour expiration (`SESSION_TTL_MS = 86400000`). | `FR-004`, `FR-005` | `backend/app/controllers/auth.controller.js` |
| `SESS-002` | Session Reuse | Login reuses an active, non-expired session token if one exists for the user. | `FR-006` | `backend/app/controllers/auth.controller.js` |
| `SESS-003` | Session Invalidation | Sign out / Log out clears session token on server and removes `user` from client `localStorage`. | `US-1.4`, Feature 4 `US-4.3` | `backend/app/controllers/auth.controller.js`, `frontend/src/components/MenuBar.vue` |
| `SESS-004` | Unauthorized Handling | Missing, invalid, or expired tokens receive `401 Unauthorized`; client clears stored session and redirects to login. | `US-1.3`, `US-1.5` | `backend/app/authorization/authorization.js`, `frontend/src/services/services.js` |

## 3. Validation & Registration Rules

| Rule ID | Name | Rule / Behavior | Provenance | Enforcement |
|---------|------|-----------------|------------|-------------|
| `VAL-001` | Registration Fields | First name, last name, email, username, and password are required. | `FR-002` | `backend/app/controllers/auth.controller.js`, `frontend/src/views/Register.vue` |
| `VAL-002` | Email Format | Email must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Error message: `"Enter a valid email address."`. | `FR-009` | `frontend/src/config/validation.js`, `frontend/src/views/Register.vue` |
| `VAL-003` | Password Length | Password must be at least 8 characters long. Error message: `"Password must be at least 8 characters."`. | `US-1.1` | `backend/app/controllers/auth.controller.js`, `frontend/src/views/Register.vue` |
| `VAL-004` | Password Confirmation | Registration requires matching password confirmation. Error message: `"Passwords do not match."`. | `US-1.1` | `frontend/src/views/Register.vue` |
| `VAL-005` | Duplicate Username | Duplicate username returns `400` with `"Username is already taken."`. | `US-1.1` | `backend/app/controllers/auth.controller.js` |
| `VAL-006` | Duplicate Email | Duplicate email returns `400` with `"Email is already registered."`. | `US-1.1` | `backend/app/controllers/auth.controller.js` |

## 4. Data isolation

| Rule ID | Name | Rule / Behavior | Provenance | Enforcement |
|---------|------|-----------------|------------|-------------|
| `OWN-001` | List query scope | List reads/writes filter by `userId: req.user.id`. Cross-user access returns `404`. | Feature 2 `FR-003`, `US-2.5` | `backend/app/authorization/authorization.js`, `backend/app/controllers/list.controller.js` |
| `OWN-002` | List create ownership | New lists set `userId` from `req.user.id` only; body `userId` is ignored. | Feature 2 `FR-004` | `backend/app/controllers/list.controller.js` |
| `LIST-001` | List name rules | Names are trimmed; empty rejected; max 100 characters. | Feature 2 `FR-005` | `backend/app/controllers/list.controller.js`, `frontend/src/views/Dashboard.vue` |
| `LIST-002` | List sort | `GET /todo/lists` returns lists ordered by name ascending. | Feature 2 `FR-006` | `backend/app/controllers/list.controller.js` |
| `OWN-003` | Todo scope | Todo reads/writes require owned parent list and `userId: req.user.id`. Cross-user access returns `404`. | Feature 3 `FR-003` | `backend/app/authorization/authorization.js`, `backend/app/controllers/todo.controller.js` |
| `TODO-001` | Todo defaults and sort | New todos are incomplete; lists return incomplete first, then `createdAt` ascending. | Feature 3 `FR-007`, `FR-009` | `backend/app/controllers/todo.controller.js` |
| `TODO-002` | List cascade | Deleting a list deletes its todos. | Feature 3 `FR-008` | `backend/app/models/index.js` |
| `TODO-003` | Due dates | Optional `dueDate` is calendar-only; invalid strings return `400`; `null` on PUT clears; omit leaves unchanged. Incomplete past-due todos use overdue styling in the UI. | Feature 5 | `backend/app/utils/dueDate.js`, `backend/app/controllers/todo.controller.js`, `frontend/src/views/Dashboard.vue` |
| `OWN-004` | Profile self-access | Users may GET/PUT only their own profile; other ids return `404`. | Feature 4 `FR-002` | `backend/app/authorization/authorization.js`, `backend/app/controllers/user.controller.js` |

## 5. UI & Routing Rules

| Rule ID | Name | Rule / Behavior | Provenance | Enforcement |
|---------|------|-----------------|------------|-------------|
| `UI-001` | Auth Layout | Login and Register pages use full-screen layout without `MenuBar`. | Screen Reqs | `frontend/src/App.vue`, `frontend/src/views/Login.vue`, `frontend/src/views/Register.vue` |
| `UI-002` | Route Guards | Unauthenticated users accessing non-auth routes redirect to `/login`; authenticated users accessing `/login` or `/register` redirect to `/`. | `US-1.3`, `US-1.5` | `frontend/src/router.js` |
| `UI-003` | Error Alerts | Form and API errors are rendered in `<v-alert type="error">`. | Screen Reqs | `frontend/src/views/Login.vue`, `frontend/src/views/Register.vue`, `frontend/src/views/Dashboard.vue` |
| `UI-004` | MenuBar | Signed-in chrome uses a profile icon dropdown (name, username, email, Edit Profile, Log out). No standalone Sign out button. | Feature 4 Screen Reqs | `frontend/src/App.vue`, `frontend/src/components/MenuBar.vue` |
| `UI-005` | Lists empty state | Zero lists shows **"No lists yet. Create your first list."** | Feature 2 `US-2.2` | `frontend/src/views/Dashboard.vue` |
| `UI-006` | Todo items dialog | List rows have an **Items** action; todos are managed in nested dialogs. Empty list items show **"No todos in this list yet."** | Feature 3 Screen Reqs | `frontend/src/views/Dashboard.vue` |
