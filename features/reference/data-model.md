# Data Model Reference

**Status:** Updated for Feature 2 (Todo List Management).

## Tables

### `users`

Represents registered user accounts in the system.

| Column | Type | Nullable | Default | Description / Constraints |
|--------|------|----------|---------|---------------------------|
| `id` | INTEGER | No | Auto-increment | Primary Key |
| `fName` | STRING | No | — | First name |
| `lName` | STRING | No | — | Last name |
| `email` | STRING | No | — | Unique email address |
| `username` | STRING(100) | No | — | Unique username (stored lowercase) |
| `password` | STRING(255) | No | — | Bcrypt hashed password (excluded in `defaultScope`) |
| `role` | STRING(20) | No | `'worker'` | User role |

### `sessions`

Represents server-side session tracking and token validation.

| Column | Type | Nullable | Default | Description / Constraints |
|--------|------|----------|---------|---------------------------|
| `id` | INTEGER | No | Auto-increment | Primary Key |
| `token` | STRING | No | — | JWT session token |
| `email` | STRING | No | — | Email of the session user |
| `expirationDate` | DATE | No | — | Session expiry timestamp (24h TTL) |
| `userId` | INTEGER | No | — | Foreign Key referencing `users.id` |

### `lists`

Named todo lists owned by a single user.

| Column | Type | Nullable | Default | Description / Constraints |
|--------|------|----------|---------|---------------------------|
| `id` | INTEGER | No | Auto-increment | Primary Key |
| `name` | STRING(100) | No | — | List name; trimmed; max 100 characters |
| `userId` | INTEGER | No | — | Foreign Key referencing `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | No | Sequelize | Timestamp |
| `updatedAt` | DATE | No | Sequelize | Timestamp |

## Associations

- **User ↔ Session**:
  - `User.hasMany(Session, { foreignKey: "userId", as: "sessions", onDelete: "CASCADE" })`
  - `Session.belongsTo(User, { foreignKey: "userId", as: "user" })`
- **User ↔ List**:
  - `User.hasMany(List, { foreignKey: "userId", as: "lists", onDelete: "CASCADE" })`
  - `List.belongsTo(User, { foreignKey: "userId", as: "user" })`
