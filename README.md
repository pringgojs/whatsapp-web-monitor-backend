# WhatsApp Web Monitor - Backend

This is the backend service for WhatsApp Web Monitor, built with Node.js, Express, and whatsapp-web.js. It provides RESTful APIs for managing WhatsApp Web sessions, user authentication, and client monitoring.

## Features

- Multi-client WhatsApp Web session management
- QR code authentication and session status monitoring
- User authentication (JWT-based)
- Role-based access control (admin/user)
- RESTful API for frontend integration

## Requirements

- Node.js v16 or later
- npm

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**

   - Copy `.env.example` to `.env` and adjust as needed (or set `JWT_SECRET` in your environment).

3. **Run the backend server:**
   ```bash
   node src/index.js
   # or
   npm start
   ```
   The server will run on `http://localhost:3000` by default.

## API Endpoints (Main)

- `POST   /auth/login` — User login
- `POST   /auth/register` — User registration
- `GET    /sessions` — List all WhatsApp clients
- `POST   /sessions/:clientId` — Create/init WhatsApp session (scan QR)
- `GET    /sessions/:clientId/status` — Get client status
- `GET    /sessions/:clientId/qr` — Get QR code for WhatsApp login
- `DELETE /clients/:clientId` — Delete client
- `POST   /clients/:clientId/disconnect` — Logout WhatsApp client
- `POST   /clients/:clientId/destroy` — Destroy WhatsApp connection (keep session)

> See the code for more endpoints and details.

## Development

- Code is located in `src/`
- Main entry: `src/index.js` or `index.js`
- Session logic: `src/clients/sessionManager.js`

## License

MIT
