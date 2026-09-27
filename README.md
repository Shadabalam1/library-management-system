# 📚 Library Management System

## 🚀 Features
- User Authentication (JWT)
- Role-based access (Admin/User)
- Book management
- Borrow & Return system

## 🛠 Tech Stack
- React + Vite
- Node.js + Express
- MongoDB

## Setup Instructions

### Local development

1. Create the server environment file from `server/config/config.env.example` and set MongoDB, SMTP, JWT, and Cloudinary values.
2. Install and run the API:

```powershell
cd server
npm install
npm run dev
```

3. Create `client/.env` from `client/.env.example`, then start the frontend:

```powershell
cd client
npm install
npm run dev
```

### Production deployment

- Deploy the `server` directory as a Node.js service with `npm start`.
- Deploy the `client` directory as a static Vite site with `npm run build`; publish the `dist` directory.
- Set `VITE_API_BASE_URL` on the client to the deployed API URL ending in `/api/v1`.
- Set `FRONTEND_URL` on the server to the exact HTTPS client URL.
- Use a hosted MongoDB connection string and production SMTP, JWT, and Cloudinary secrets. Do not deploy `server/config/config.env` or commit secrets.
- Set `NODE_ENV=production`, `COOKIE_SAME_SITE=None`, and `COOKIE_DOMAIN` only when your hosting setup requires a shared parent domain. HTTPS is required for cross-site cookies.
- Configure the frontend host to serve `index.html` for unknown routes so React Router links work after refresh.

The API health check is available at `/health`. After deployment, test registration, OTP verification, login, book listing, borrowing, return, renewal, and logout from the deployed client.