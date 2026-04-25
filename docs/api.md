# VoiceOps API Reference

This is the backend API contract for the VoiceOps mobile app and admin panel.
The mobile team should use this as the source of truth for what each endpoint
takes and returns. Examples in this document are real responses captured from
the running dev server against the seed data — not hand-written guesses.

**Base URL:** `http://localhost:3000`

All request and response bodies are JSON. Send `Content-Type: application/json`
on every POST or PATCH.

---

## Authentication overview

The mobile app uses a Bearer token flow:

1. **Login** — `POST /api/auth/mobile-login` with `{ email, password }`. The
   server returns `{ token, user }`. The token is a signed JWT (HS256) with a
   30 day expiry. It carries `sub` (user id) and `role` claims.
2. **Subsequent requests** — set the header `Authorization: Bearer <token>` on
   every protected endpoint.
3. **Token expired or wrong** — the server returns `401 Unauthorized`. The app
   should clear the stored token and send the user back to the login screen.

The web admin panel uses NextAuth session cookies (`/api/auth/[...nextauth]`).
The mobile team can ignore that — the NextAuth route is not designed to be
called from a mobile client. Endpoints that say "Bearer or session" accept
either, so the same backend serves both.

### Roles

| Role        | Can do                                                |
|-------------|--------------------------------------------------------|
| ADMIN       | Everything                                             |
| MANAGER     | All work orders, services, users (read), cancel WOs    |
| TECHNICIAN  | Own work orders only, status transitions (no cancel)   |
| CUSTOMER    | Own work orders only, profile (read/update)            |

### Work order status transitions

The status update endpoint enforces this state machine. Any attempt to make a
transition outside this map returns `422 Unprocessable Entity`.

```
PENDING     → EN_ROUTE, IN_PROGRESS, CANCELLED
EN_ROUTE    → ON_SITE, CANCELLED
ON_SITE     → IN_PROGRESS, CANCELLED
IN_PROGRESS → COMPLETED, CANCELLED
COMPLETED   → (terminal)
CANCELLED   → (terminal)
```

Technicians can only set `EN_ROUTE`, `ON_SITE`, `IN_PROGRESS`, or `COMPLETED`.
Cancellations are manager/admin only.

---

# Auth

### POST /api/auth/register

Create a new user account. Used by the customer signup flow.

**Auth:** None (public).

**Request body:**
```json
{
  "email": "docsuser@voiceops.com",
  "password": "Password123",
  "name": "Docs User",
  "role": "CUSTOMER"
}
```

Field rules:
- `email` — required, must look like an email address.
- `password` — required, minimum 8 characters.
- `name` — required, trimmed.
- `role` — optional. One of `ADMIN`, `MANAGER`, `TECHNICIAN`, `CUSTOMER`.
  Anything else (or missing) defaults to `CUSTOMER`. The password is never
  returned.

**Response 201:**
```json
{
  "id": "cmodw85w90001s8w5sp8qx0pl",
  "name": "Docs User",
  "email": "docsuser@voiceops.com",
  "role": "CUSTOMER",
  "status": "ACTIVE",
  "createdAt": "2026-04-25T05:22:55.065Z"
}
```

**Errors:**
- `400` — invalid email, password under 8 characters, or missing name.
- `409` — email already in use:
  ```json
  { "error": "Email already in use" }
  ```

---

### POST /api/auth/mobile-login

Trade email + password for a JWT. This is what the mobile app calls on the
login screen.

**Auth:** None (public).

**Request body:**
```json
{
  "email": "manager@voiceops.com",
  "password": "Manager@1234"
}
```

Email lookup is case-insensitive.

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW82dmpjM20wMDAxODR3NXFwbmZ1dGhzIiwicm9sZSI6Ik1BTkFHRVIiLCJpYXQiOjE3NzcwOTQ1NzUsImV4cCI6MTc3OTY4NjU3NX0.3HeFqmCmRFvcw9i_NiegZJSggQgKScEbQj5ZAG7mnyc",
  "user": {
    "id": "cmo6vjc3m000184w5qpnfuths",
    "name": "Rachel Torres",
    "email": "manager@voiceops.com",
    "role": "MANAGER"
  }
}
```

The mobile app should store the token (encrypted storage / Keychain on iOS,
EncryptedSharedPreferences on Android), and the `user` object in Redux.

**Errors:**
- `400` — `email` or `password` missing.
- `401` — wrong password, no such user, or the user account is not active:
  ```json
  { "error": "Invalid credentials" }
  ```

---

### `/api/auth/[...nextauth]` — web only

Web admin panel uses NextAuth's credentials provider here. The mobile app
does not call this endpoint. It sets HTTP-only cookies, which is the wrong
shape for a React Native client.

---

# Users

### GET /api/users/me

Return the currently logged-in user's profile.

**Auth:** Bearer token (any role).

**Response 200:**
```json
{
  "id": "cmo6vjckz000284w5rkqlozmj",
  "name": "Jake Miller",
  "email": "tech@voiceops.com",
  "role": "TECHNICIAN",
  "status": "ACTIVE",
  "phone": "+61 412 345 678",
  "createdAt": "2026-04-20T07:29:14.099Z"
}
```

**Errors:**
- `401` — missing, malformed, or expired token.
- `404` — token verified but the user no longer exists in the database (rare).

---

### PATCH /api/users/me

Update the logged-in user's own profile. Only `name` and `phone` can be
changed via this endpoint. Any other fields in the request body are silently
ignored — the role/email/password cannot be self-updated here.

**Auth:** Bearer token (any role).

**Request body:** (all fields optional)
```json
{
  "name": "Jake Miller",
  "phone": "+61 412 345 678"
}
```

Field rules:
- `name` — string, trimmed, 1–100 characters.
- `phone` — string, max 20 characters, only digits, spaces, `+`, `-`, `(`, `)`
  allowed. Pass `null` or `""` to clear.

**Response 200:**
```json
{
  "id": "cmo6vjckz000284w5rkqlozmj",
  "name": "Jake Miller",
  "email": "tech@voiceops.com",
  "role": "TECHNICIAN",
  "status": "ACTIVE",
  "phone": "+61 412 345 678",
  "createdAt": "2026-04-20T07:29:14.099Z"
}
```

**Errors:**
- `400` — name out of range, phone too long, or phone has bad characters.
- `401` — missing or invalid token.

---

# Services

### GET /api/services

List every service in the catalog. Used by the create work order flow on
both web and mobile.

**Auth:** None (public for now).

**Response 200:**
```json
[
  {
    "id": "cmo6w47a0000188w5405nvzaj",
    "name": "CCTV Installation",
    "slug": "cctv-installation",
    "description": "Install security cameras",
    "durationMinutes": 180,
    "basePrice": 300,
    "isActive": true,
    "createdAt": "2026-04-20T07:45:27.000Z",
    "updatedAt": "2026-04-20T07:45:27.000Z"
  },
  {
    "id": "cmo6vjd2u000484w5pypw83ta",
    "name": "Electrical Inspection",
    "slug": "electrical-inspection",
    "description": "Full residential electrical safety inspection",
    "durationMinutes": 90,
    "basePrice": 180,
    "isActive": true,
    "createdAt": "2026-04-20T07:29:14.742Z",
    "updatedAt": "2026-04-20T07:29:14.742Z"
  }
]
```

(Truncated — typically 4–6 services from the seed.)

---

### POST /api/services

Create a new service. Slug is auto-generated from the name.

**Auth:** Bearer token, ADMIN or MANAGER only.

**Request body:**
```json
{
  "name": "Smoke Alarm Test",
  "description": "Annual smoke alarm compliance test",
  "basePrice": 95,
  "durationMinutes": 30,
  "isActive": true
}
```

Field rules:
- `name` — required, trimmed.
- `description` — optional string.
- `basePrice` — optional number, must be `>= 0` if present.
- `durationMinutes` — optional integer.
- `isActive` — optional boolean. Defaults to `true`.

**Response 201:**
```json
{
  "id": "cmodw86ye0002s8w5sgdz20on",
  "name": "Smoke Alarm Test",
  "slug": "smoke-alarm-test",
  "description": "Annual smoke alarm compliance test",
  "durationMinutes": 30,
  "basePrice": 95,
  "isActive": true,
  "createdAt": "2026-04-25T05:22:56.438Z",
  "updatedAt": "2026-04-25T05:22:56.438Z"
}
```

**Errors:**
- `400` — name missing, or `basePrice` is negative.
- `401` — no token / invalid token:
  ```json
  { "error": "Missing or invalid Authorization header" }
  ```
- `403` — token belongs to a TECHNICIAN or CUSTOMER:
  ```json
  { "error": "Insufficient permissions" }
  ```
- `409` — a service with the same slug already exists.

---

### GET /api/services/:id

Get a single service by id.

**Auth:** None.

**Response 200:**
```json
{
  "id": "cmodw86ye0002s8w5sgdz20on",
  "name": "Smoke Alarm Test",
  "slug": "smoke-alarm-test",
  "description": "Annual smoke alarm compliance test",
  "durationMinutes": 30,
  "basePrice": 95,
  "isActive": true,
  "createdAt": "2026-04-25T05:22:56.438Z",
  "updatedAt": "2026-04-25T05:22:56.438Z"
}
```

**Errors:**
- `404` — no service with that id.

---

### PATCH /api/services/:id

Update fields on a service. Only the fields you send are touched. Renaming
the service regenerates the slug.

**Auth:** Bearer token, ADMIN or MANAGER only.

**Request body:** (all fields optional)
```json
{
  "basePrice": 105,
  "isActive": true
}
```

Validation matches POST. `basePrice` must be `>= 0` if present.

**Response 200:**
```json
{
  "id": "cmodw86ye0002s8w5sgdz20on",
  "name": "Smoke Alarm Test",
  "slug": "smoke-alarm-test",
  "description": "Annual smoke alarm compliance test",
  "durationMinutes": 30,
  "basePrice": 105,
  "isActive": true,
  "createdAt": "2026-04-25T05:22:56.438Z",
  "updatedAt": "2026-04-25T05:22:59.133Z"
}
```

**Errors:**
- `400` — `basePrice` negative.
- `401` — missing/invalid token.
- `403` — wrong role.
- `404` — service not found.

---

### DELETE /api/services/:id

Hard-delete a service.

**Auth:** Bearer token, ADMIN or MANAGER only.

**Response 200:**
```json
{ "message": "Service deleted" }
```

**Errors:**
- `401` — missing/invalid token.
- `403` — wrong role.
- `404` — service not found.

---

# Work Orders

### GET /api/work-orders

List work orders. Supports filtering and pagination. The result is
auto-scoped by role: technicians only see jobs assigned to them, customers
only see jobs they raised. Admins and managers see everything.

**Auth:** Bearer token or NextAuth session.

**Query params:** (all optional, all combinable)
| Name          | Type   | Required | Notes                                                 |
|---------------|--------|----------|-------------------------------------------------------|
| `status`      | string | no       | One of `PENDING`, `EN_ROUTE`, `ON_SITE`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. Invalid values → 400. |
| `technicianId`| string | no       | Filter by assigned technician id.                     |
| `customerId`  | string | no       | Filter by customer id.                                |
| `from`        | string | no       | `YYYY-MM-DD`. `scheduledAt >= from` (inclusive).      |
| `to`          | string | no       | `YYYY-MM-DD`. `scheduledAt <= end of day` (inclusive).|
| `page`        | int    | no       | Default `1`.                                          |
| `pageSize`    | int    | no       | Default `20`. Max `100`.                              |

**Response 200:**
```json
{
  "data": [
    {
      "id": "test-wo-other",
      "referenceNumber": "VO-TEST1",
      "customerId": "cmo6vjd2j000384w54on4g184",
      "technicianId": "cmodvquwn0000s8w5v8blt682",
      "serviceId": null,
      "status": "PENDING",
      "priority": "NORMAL",
      "scheduledAt": null,
      "address": null,
      "issueDescription": null,
      "resolutionNotes": null,
      "cancelledAt": null,
      "cancelledReason": null,
      "createdAt": "2026-04-25T11:09:29.021Z",
      "updatedAt": "2026-04-25T11:09:29.021Z",
      "customer": {
        "id": "cmo6vjd2j000384w54on4g184",
        "name": "John Smith",
        "email": "customer@voiceops.com"
      },
      "technician": {
        "id": "cmodvquwn0000s8w5v8blt682",
        "name": "Mike Other",
        "email": "tech2@voiceops.com"
      },
      "service": null
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

**Errors:**
- `400` — `status` is not one of the enum values:
  ```json
  { "error": "Invalid status. Must be one of: PENDING, EN_ROUTE, ON_SITE, IN_PROGRESS, COMPLETED, CANCELLED" }
  ```
- `401` — missing/invalid token and no session.

---

### POST /api/work-orders

Create a work order.

**Auth:** NextAuth session (admin panel today). Mobile manager flow comes
later in Sprint 2.

**Request body:**
```json
{
  "customerId": "cmo6vjd2j000384w54on4g184",
  "serviceId": "cmo6vjd31000584w5qg67rggy",
  "priority": "HIGH",
  "scheduledAt": "2026-04-30T09:00:00Z",
  "address": "12 George St, Sydney NSW 2000",
  "issueDescription": "AC unit dripping water"
}
```

Field rules:
- `customerId` — required.
- `serviceId` — optional.
- `priority` — optional. `NORMAL` (default) | `HIGH` | `URGENT`.
- `scheduledAt` — optional ISO date string.
- `address` — optional string.
- `issueDescription` — optional string.

The reference number (e.g. `VO-00007`) is generated server-side.

**Response 201:** Newly created work order object (same shape as in
`GET /api/work-orders/:id` but without the joined `customer`/`technician`/
`service` blocks).

**Errors:**
- `400` — `customerId` missing.
- `401` — no NextAuth session.

---

### GET /api/work-orders/:id

Single work order with full joined customer, technician, and service info
(including phone numbers).

**Auth:** NextAuth session.

**Response 200:** A single work order object — same shape as one element
of the `data[]` array in the list endpoint, plus full `service` object and
`phone` on `customer` / `technician`.

**Errors:**
- `401` — no session.
- `404` — no work order with that id.

---

### PATCH /api/work-orders/:id

Update a work order. The most important use case is updating status — the
endpoint enforces the state machine described at the top of this doc.

**Auth:** Bearer token or NextAuth session.

**Role rules:**
- `CUSTOMER` — `403`. Customers cannot update work orders.
- `TECHNICIAN` — only on work orders where they are the assigned technician,
  and only with target status `EN_ROUTE`, `ON_SITE`, `IN_PROGRESS`, or
  `COMPLETED`. Cancellations return `403`.
- `ADMIN`, `MANAGER` — any allowed transition.

**Request body:** (any subset)
```json
{
  "status": "EN_ROUTE",
  "address": "12 George St, Sydney NSW 2000",
  "scheduledAt": "2026-04-30T09:00:00Z",
  "priority": "HIGH",
  "resolutionNotes": "Replaced capacitor"
}
```

Setting `status` to `CANCELLED` automatically sets `cancelledAt` to now.

**Response 200:** Updated work order object.
```json
{
  "id": "test-wo-other",
  "referenceNumber": "VO-TEST1",
  "customerId": "cmo6vjd2j000384w54on4g184",
  "technicianId": "cmodvquwn0000s8w5v8blt682",
  "serviceId": null,
  "status": "EN_ROUTE",
  "priority": "NORMAL",
  "scheduledAt": null,
  "address": null,
  "issueDescription": null,
  "resolutionNotes": null,
  "cancelledAt": null,
  "cancelledReason": null,
  "createdAt": "2026-04-25T11:09:29.021Z",
  "updatedAt": "2026-04-25T05:23:49.732Z"
}
```

**Errors:**
- `400` — `status` is not one of the enum values.
- `401` — no auth.
- `403` — customer trying to update; technician on a WO not assigned to them;
  technician trying to set a status they're not allowed to set.
- `404` — no work order with that id.
- `422` — illegal status transition. The response body lists what the current
  status can transition to:
  ```json
  {
    "error": "Invalid status transition",
    "from": "EN_ROUTE",
    "to": "COMPLETED",
    "allowed": ["ON_SITE", "CANCELLED"]
  }
  ```

---

# Common error shape

Every error response is JSON with at least an `error` field. Some endpoints
add extra context fields (e.g. the `from` / `to` / `allowed` fields on a
422 from the work order PATCH). The mobile client should always read
`error` for the user-visible message and fall back to a generic message
if the body is not JSON.
