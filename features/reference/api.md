# API Reference

**Status:** Updated for Feature 2 (Todo List Management).

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

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "Human-readable explanation." }` with appropriate status code (`400`, `401`, `404`, `500`).
- Authenticated routes: `Authorization: Bearer <token>`.
