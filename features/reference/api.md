# API Reference

**Status:** Updated for Feature 4 (User Profile Management).

API mount path is `/todo` (see `backend/server.js`).

## Endpoints

### Authentication

| Method | Endpoint | Auth | Purpose | Success Status |
|--------|----------|------|---------|----------------|
| `POST` | `/todo/register` | No | Create a new user account and initiate session | `201 Created` |
| `POST` | `/todo/login` | No | Authenticate user with credentials and issue/reuse session token | `200 OK` |
| `POST` | `/todo/logout` | Bearer Token | Invalidate current session token on server | `200 OK` |

#### `POST /todo/register`
- **Request Body:**
  ```json
  {
    "fName": "Jane",
    "lName": "Doe",
    "email": "jdoe@example.com",
    "username": "jdoe",
    "password": "password123"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "userId": 1,
    "username": "jdoe",
    "email": "jdoe@example.com",
    "fName": "Jane",
    "lName": "Doe",
    "role": "worker",
    "token": "<jwt-token>"
  }
  ```

#### `POST /todo/login`
- **Request Body:**
  ```json
  {
    "username": "jdoe",
    "password": "password123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "userId": 1,
    "username": "jdoe",
    "email": "jdoe@example.com",
    "fName": "Jane",
    "lName": "Doe",
    "role": "worker",
    "token": "<jwt-token>"
  }
  ```

#### `POST /todo/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "message": "Signed out successfully."
  }
  ```

### Lists

| Method | Endpoint | Auth | Purpose | Success Status |
|--------|----------|------|---------|----------------|
| `GET` | `/todo/lists` | Bearer Token | Return lists owned by the authenticated user, ordered by name | `200 OK` |
| `POST` | `/todo/lists` | Bearer Token | Create a list owned by the authenticated user | `201 Created` |
| `PUT` | `/todo/lists/:listId` | Bearer Token | Rename an owned list | `200 OK` |
| `DELETE` | `/todo/lists/:listId` | Bearer Token | Delete an owned list | `200 OK` |

**List object:**
```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

- **Create body:** `{ "name": "Groceries" }`. Client `userId` is ignored; ownership is `req.user.id`.
- **Rename body:** `{ "name": "Shopping" }`.
- **Validation:** trimmed name required; max 100 characters (`"List name must be 100 characters or fewer."`).
- **Not owned / missing:** `404` `{ "message": "List with id=<id> not found." }`
- **Unauthenticated:** `401`

### Todos

| Method | Endpoint | Auth | Purpose | Success Status |
|--------|----------|------|---------|----------------|
| `GET` | `/todo/lists/:listId/todos` | Bearer Token | Fetch todos in an owned list (incomplete first, then `createdAt` ascending) | `200 OK` |
| `POST` | `/todo/lists/:listId/todos` | Bearer Token | Add a todo to an owned list | `201 Created` |
| `PUT` | `/todo/todos/:id` | Bearer Token | Update title and/or `completed` on an owned todo | `200 OK` |
| `DELETE` | `/todo/todos/:id` | Bearer Token | Delete an owned todo | `200 OK` |

**Todo object:**
```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

- **Create body:** `{ "title": "Buy milk" }`. Client `userId` / `listId` spoofing is ignored.
- **New todos** default to `completed: false`. Title is trimmed; empty rejected (`"Todo title is required."`); max 255 characters.
- Parent list or todo not owned: `404` (`List with id=<id> not found.` / `Todo with id=<id> not found.`).
- Deleting a list cascades to its todos.

### Users

| Method | Endpoint | Auth | Purpose | Success Status |
|--------|----------|------|---------|----------------|
| `GET` | `/todo/users/:id` | Bearer Token | Fetch the authenticated user's profile | `200 OK` |
| `PUT` | `/todo/users/:id` | Bearer Token | Update the authenticated user's profile | `200 OK` |

**Profile object:** `id`, `fName`, `lName`, `email`, `username`, `role`, timestamps. Never includes `password`.

- Self-access only (`:id` must equal `req.user.id`); otherwise `404` `{ "message": "User with id=<id> not found." }`.
- `password` is optional on update; when provided it must be at least 8 characters and is bcrypt-hashed.
- Duplicate username/email return `400` with the same messages as registration.

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "Human-readable explanation." }` with appropriate status code (`400`, `401`, `404`, `500`).
- Authenticated routes: `Authorization: Bearer <token>`.
