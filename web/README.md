# Arthum AI — Account Deletion Web Page

A standalone **Next.js 14 (App Router)** web application providing a public account deletion request page for Arthum AI users.

## Overview

This web app exposes a single public route — `/account-deletion` — where users can submit an account deletion request by providing their registered email address and password. The root (`/`) automatically redirects to this route.

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (Inter font, metadata)
│   │   ├── globals.css                 # Tailwind base + brand CSS variables
│   │   ├── page.tsx                    # Root redirect → /account-deletion
│   │   └── account-deletion/
│   │       └── page.tsx                # Server component page + SEO metadata
│   ├── components/
│   │   └── AccountDeletionForm.tsx     # Main client component (form + UI)
│   └── lib/
│       └── api.ts                      # API client + ApiError class
├── .env.local                          # Local env vars (gitignored)
├── .env.local.example                  # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18.17+ (required by Next.js 14)
- npm 9+

### Installation

```bash
cd web
npm install
```

### Environment Variables

Copy the example file and set the API base URL:

```bash
cp .env.local.example .env.local
```

`.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Point `NEXT_PUBLIC_API_BASE_URL` at your running Arthum AI backend. The backend must expose:

```
POST /api/account-deletion/request
Content-Type: application/json

{ "email": "user@example.com", "password": "secret" }
```

### Running the Dev Server

```bash
npm run dev
```

Then open [http://localhost:3000/account-deletion](http://localhost:3000/account-deletion).

### Production Build

```bash
npm run build
npm start
```

---

## Account Deletion Flow

The end-to-end flow mirrors the mobile app (`AccountDeletionView.tsx`) but adds **password confirmation** as an extra security step:

| Step | What Happens |
|------|-------------|
| 1 | User visits `/account-deletion` and fills in email + password |
| 2 | Form POSTs to `POST /api/account-deletion/request` with `{ email, password }` |
| 3 | Backend sends a confirmation email to the registered address |
| 4 | User replies from their registered email to confirm the request |
| 5 | After verification, the account is deactivated and scheduled for deletion |
| 6 | Account and all associated data are permanently deleted |
| 7 | Associated data is retained for **180 days** post-deletion (per legal requirements) |

> **Note:** Submitting the form does not immediately delete the account. The user must complete the email confirmation step.

---

## Security Considerations

- **Password never persisted** — the password field value is never written to `localStorage`, `sessionStorage`, or cookies.
- **Password cleared on completion** — whether the request succeeds or fails, the password field is cleared from React state immediately after the API call returns.
- **No password logging** — no `console.log` or similar calls reference the password value.
- **30-second timeout** — API calls use `AbortSignal.timeout(30_000)` to prevent indefinite hangs.
- **Input sanitisation** — email is trimmed and lowercased before being sent to the API.

---

## Error Handling

| Scenario | User-Facing Message |
|----------|-------------------|
| 401 Unauthorized | "The email or password you entered is incorrect." |
| 429 Too Many Requests | "Too many requests. Please wait a few minutes and try again." |
| 500+ Server Error | "The server encountered an error. Please try again later." |
| Network / fetch TypeError | "Unable to connect to the server. Please check your internet connection and try again." |
| Request Timeout | "The request timed out. Please check your connection and try again." |
| Other API errors | The `message` field from the API JSON response |

---

## Testing the Full Flow End-to-End

1. **Start the Arthum AI backend** (from the `AuthFlow` root or wherever the API server lives):
   ```bash
   # Example — adjust to your actual backend start command
   npm run server
   # or
   node server.js
   ```

2. **Start the Next.js dev server**:
   ```bash
   cd web
   npm run dev
   ```

3. **Open the page**: [http://localhost:3000/account-deletion](http://localhost:3000/account-deletion)

4. **Happy path**:
   - Enter a valid registered email and correct password
   - Click "Request Account Deletion"
   - Expect the green success card to appear
   - Check the registered email inbox for the confirmation email

5. **Error paths to verify**:
   - Wrong password → red error box with 401 message
   - Empty fields → inline validation errors below each field
   - Backend down → network error message
   - Rate limited → 429 message

6. **Accessibility**:
   - Tab through the form — focus order should be email → password → show/hide toggle → submit
   - Use a screen reader — error messages use `role="alert"` and `aria-invalid`

---

## Support

Contact: [pinaarthumai@gmail.com](mailto:pinaarthumai@gmail.com)
