# COMP 3123 Assignment 1 – Secure Employee Management API

**Student:** Nicholas Lee (101303788)

A secure RESTful backend built with Node.js, Express and MongoDB. Users sign up and log in to receive a JWT, then manage **their own** employees. Every employee belongs to the user who created it, and no user can see, change or delete another user's employees.

## Technologies

| Purpose | Package |
|---|---|
| Server and routing | Node.js 20.6+, Express 5 |
| Database | MongoDB (Atlas) with Mongoose 8 |
| Password hashing | bcryptjs |
| Authentication | jsonwebtoken (JWT) |
| Security headers | Helmet |
| Rate limiting | express-rate-limit |
| Input validation | express-validator |
| Logging | Custom JSON-lines file logger (`src/utils/logger.js`) |

## Project structure

```
101303788_COMP3123_Assignment1/
├── server.js                    # Entry point: connects to MongoDB, then starts the server
├── src/
│   ├── app.js                   # Express app: middleware, routes, health check, error handling
│   ├── config/
│   │   ├── env.js               # Reads and checks environment variables
│   │   └── db.js                # MongoDB connection (database: comp3123_assignment1)
│   ├── models/
│   │   ├── User.js              # User schema, password hashing
│   │   └── Employee.js          # Employee schema with `user` (owner) reference
│   ├── middleware/
│   │   ├── auth.js              # Verifies the JWT and sets req.user
│   │   ├── rateLimiters.js      # Signup, login and general API limits
│   │   ├── validate.js          # Turns validation failures into 400 responses
│   │   ├── requestLogger.js     # Logs every request
│   │   └── errorHandler.js      # 404 handler and central JSON error handler
│   ├── validators/              # express-validator rules for users and employees
│   ├── controllers/             # Request handlers (business logic)
│   ├── routes/                  # Express routers
│   └── utils/                   # Logger and AppError class
├── logs/
│   └── sample.log               # Example log output (real logs are gitignored)
├── postman/
│   └── 101303788_COMP3123_Assignment1.postman_collection.json
├── .env.example
└── package.json
```

## Installation and running

1. **Clone and install**
   ```bash
   git clone https://github.com/nlee0703/101303788_COMP3123_Assignment1.git
   cd 101303788_COMP3123_Assignment1
   npm install
   ```
2. **Configure the environment.** Copy `.env.example` to `.env` and fill in the values (see below).
3. **Start MongoDB.** Use a MongoDB Atlas cluster (make sure your IP is allowed under *Network Access*) or a local MongoDB server (`mongodb://127.0.0.1:27017`).
4. **Run the app**
   ```bash
   npm start
   ```
   Use `npm run dev` to restart automatically when files change. The server runs at `http://localhost:3000`.
5. **Test the API.** Import `postman/101303788_COMP3123_Assignment1.postman_collection.json` into Postman and run the folders in order (or use *Run collection*).

## Configuration

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string. The app always uses the `comp3123_assignment1` database. |
| `JWT_SECRET` | Yes | Long random string used to sign tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |
| `JWT_EXPIRES_IN` | No | Token lifetime, default `1h`. |
| `PORT` | No | Server port, default `3000`. |

The app refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing. `.env` is gitignored and must never be committed.

## API endpoints

Base URL: `http://localhost:3000`

| # | Method | Endpoint | Auth | Success |
|---|---|---|---|---|
| 1 | POST | `/api/v1/user/signup` | No | 201 Created |
| 2 | POST | `/api/v1/user/login` | No | 200 OK |
| 3 | GET | `/api/v1/emp/employees` | Yes | 200 OK |
| 4 | POST | `/api/v1/emp/employees` | Yes | 201 Created |
| 5 | GET | `/api/v1/emp/employees/{eid}` | Yes | 200 OK |
| 6 | PUT | `/api/v1/emp/employees/{eid}` | Yes | 200 OK |
| 7 | DELETE | `/api/v1/emp/employees?eid=xxx` | Yes | 204 No Content |
| – | GET | `/health` | No | 200 OK |

### Signup – `POST /api/v1/user/signup`
```json
{ "username": "alice", "email": "alice@example.com", "password": "Password123" }
```
Rules: username 3–30 characters (letters, numbers, `_ . -`), valid email, password 8–64 characters with an uppercase letter, a lowercase letter and a number. Username and email must be unique.

Response `201`:
```json
{
    "status": true,
    "message": "User created successfully.",
    "user_id": "6720f1c2a4b5c6d7e8f90123",
    "user": { "username": "alice", "email": "alice@example.com", "created_at": "2026-10-17T18:00:00.000Z" }
}
```

### Login – `POST /api/v1/user/login`
Log in with **either** username or email:
```json
{ "username": "alice", "password": "Password123" }
```
```json
{ "email": "alice@example.com", "password": "Password123" }
```
Response `200`:
```json
{
    "status": true,
    "message": "Login successful.",
    "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": "1h"
}
```

### Employee body (create and update)
```json
{
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@example.com",
    "position": "Software Developer",
    "salary": 75000,
    "date_of_joining": "2025-09-01",
    "department": "Engineering"
}
```
All fields are required on create. On update, send only the fields to change (at least one). `salary` must be a positive number and `date_of_joining` a valid date (`YYYY-MM-DD`). Any other field, including `user` or `_id`, is rejected with `400`.

Create returns `201` with `employee_id` and the employee. List returns `{ "status": true, "count": 1, "employees": [...] }`. Get and update return the employee. Delete returns `204` with no body.

### Error format
Every error is JSON:
```json
{
    "status": false,
    "message": "Validation failed",
    "errors": [ { "field": "salary", "message": "salary must be a positive number" } ]
}
```

| Status | When |
|---|---|
| 400 | Missing or invalid fields, unexpected fields, invalid employee id, malformed JSON |
| 401 | Missing, invalid or expired JWT; wrong login credentials |
| 403 | The employee exists but belongs to another user |
| 404 | Employee or route not found |
| 409 | Username or email already registered |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error (details are logged, never sent to the client) |

## Authentication flow

1. **Sign up** with a username, email and password. The password is hashed with bcrypt (10 salt rounds) before it is saved.
2. **Log in** with username or email and the password. The server checks the password against the hash and returns a signed JWT that expires after 1 hour. The token contains the user's id (`sub`) and username.
3. **Call protected routes** with the token in the `Authorization` header:
   ```
   Authorization: Bearer <jwt_token>
   ```
4. The `auth` middleware verifies the token's signature and expiry and checks that the user still exists. It rejects missing, invalid and expired tokens with `401`. On success it sets `req.user`.

## How ownership is enforced

- When an employee is created, its `user` field is set from `req.user.id`, which comes from the verified token. The request body is never trusted for this: sending a `user` field is rejected with `400`.
- **Every** employee query filters on the owner as well as the id, for example:
  ```js
  Employee.findOne({ _id: eid, user: req.user.id })
  Employee.findOneAndUpdate({ _id: eid, user: req.user.id }, ...)
  Employee.findOneAndDelete({ _id: eid, user: req.user.id })
  Employee.find({ user: req.user.id })
  ```
  So changing the `eid` in the URL or query string cannot reach another user's employee: the database simply does not match it.
- If that query finds nothing, the server checks whether the employee exists at all: if it belongs to someone else the response is `403 Forbidden`, otherwise `404 Not Found`. Either way, no data from the other user is returned or changed.

## Security measures

- **Password hashing:** bcrypt via a Mongoose `pre('save')` hook. The password field has `select: false`, so it is never loaded unless login explicitly asks for it, and it is removed from all JSON output.
- **JWT:** signed with `JWT_SECRET` from the environment, 1-hour expiry, verified on every protected request.
- **Helmet:** sets HTTP security headers. These help protect against:
  - cross-site scripting (XSS) and injected scripts – `Content-Security-Policy`
  - clickjacking – `X-Frame-Options` / `frame-ancestors`
  - MIME-type sniffing attacks – `X-Content-Type-Options: nosniff`
  - protocol downgrade and cookie hijacking – `Strict-Transport-Security`
  - information leaks – removes `X-Powered-By`, sets `Referrer-Policy`
- **Rate limiting:** see below.
- **Input validation:** every field is checked with express-validator (required, type, length, email format, positive salary, valid date, valid MongoDB ObjectId) and unknown fields are rejected. Mongoose schema validation is a second layer. JSON bodies are limited to 10 KB.
- **Environment variables:** all secrets live in `.env`, which is gitignored. `.env.example` documents the variables without real values.
- **Safe errors:** responses never include stack traces, password hashes, secrets or connection strings.

### Rate limiting

Rate limiting caps how many requests one client (IP address) can make in a time window. It slows down password-guessing (brute-force) attacks and stops a single client from flooding the server.

| Route | Limit | Counts |
|---|---|---|
| `POST /api/v1/user/login` | 5 per 15 minutes | Only **failed** logins, so real users are not locked out |
| `POST /api/v1/user/signup` | 10 per 15 minutes | Every attempt |
| All `/api/*` routes | 300 per 15 minutes | Every request |

When a limit is reached the server responds with **`429 Too Many Requests`** and does not process the request:
```json
{ "status": false, "message": "Too many failed login attempts. Please try again in 15 minutes." }
```
Responses also include `RateLimit` headers showing the limit and remaining requests. Each event is logged. To test it, send the *Rate limit: repeated failed logins* request in Postman until it returns 429. The counters are kept in memory, so restarting the server resets them.

## Logging

- **Location:** `logs/app.log` (created automatically; gitignored). Each line is one JSON entry, also printed to the console. See `logs/sample.log` for an example.
- **Contents:** timestamp, level, and message, plus:
  - server startup and database connection
  - every request: method, path, response status, duration and user id (if logged in)
  - signups, successful and failed logins
  - validation failures (which fields failed)
  - authorization failures (missing/invalid/expired token, access to another user's employee)
  - rate limit hits
  - employee create, update and delete
  - server errors with stack traces
- **Never logged:** passwords, password hashes, JWTs, `JWT_SECRET`, or the MongoDB connection string. Request bodies and headers are not logged, and the logger replaces any field named like `password`, `token` or `secret` with `[REDACTED]`.

## Health check

`GET http://localhost:3000/health`

Response `200` when the server and database are up:
```json
{
    "status": true,
    "message": "Server is healthy",
    "database": "connected",
    "uptime_seconds": 42,
    "timestamp": "2026-10-17T18:00:00.000Z"
}
```
If the database connection drops, it returns `503` with `"database": "disconnected"`.

## Testing

The Postman collection in `postman/` covers every endpoint with success and failure cases, in this order:

0. Health check
1. Signup: valid users A and B, duplicate username, duplicate email, invalid email, weak password, missing fields
2. Login: username login, email login, bad credentials, missing credentials
3. Employees (user A): create, missing fields, invalid email, invalid salary, invalid date, trying to set the owner, missing JWT, invalid JWT, malformed JSON, list, get, invalid id, not found, update, invalid update
4. Employees (user B): create and list (does not include user A's employee)
5. **Two-user ownership test:** user B cannot get, update or delete user A's employee, and user A cannot do the same to user B's (all `403`), and user A's data is unchanged
6. Delete: missing eid, missing JWT, delete own employees (`204`), deleted employee returns `404`
7. Unknown route (`404`) and rate limiting (`429`)

The collection saves tokens and ids in collection variables automatically and creates new users on each run (`alice_<runId>`, `bob_<runId>`), so it can be run more than once. Restart the server between full runs to reset the rate limit counters.

### Sample test credentials

These are created by the Postman collection; you can also sign them up manually:

| User | Username | Email | Password |
|---|---|---|---|
| A | `alice_<runId>` | `alice_<runId>@example.com` | `Password123` |
| B | `bob_<runId>` | `bob_<runId>@example.com` | `Password123` |
