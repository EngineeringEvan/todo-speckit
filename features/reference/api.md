# API Reference

**Status:** Updated for Feature 1 (User Authentication & Session Management).

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

### Lists (auth foundation)

Feature 1 ships a read-only lists endpoint so session scoping can be proven (`US-1.3`). Create/update/delete belong to Feature 2.

| Method | Endpoint | Auth | Purpose | Success Status |
|--------|----------|------|---------|----------------|
| `GET` | `/todo/lists` | Bearer Token | Return lists owned by the authenticated user | `200 OK` |

#### `GET /todo/lists`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:** array of list objects (`id`, `name`, `userId`, timestamps). Empty array if the user has no lists.
- **Errors:** `401` when the token is missing, invalid, or expired.

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "Human-readable explanation." }` with appropriate status code (`400`, `401`, `404`, `500`).
- Authenticated routes: `Authorization: Bearer <token>`.
