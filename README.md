name=README.md
# MyFinance

A responsive personal finance web app built with React + Vite (front-end) and a small Node/Express auth/server. Designed to track transactions, income, budgets, savings goals, and profile information.

---

Quick links
- Live / Demo: (Add URL here)
- Repo: https://github.com/SAMUELinfinty/MyFinance

Table of contents
- About
- Key features (user-facing)
- Screenshots / Demo
- For users — how to use the app
- For developers — local setup & development
  - Prerequisites
  - Frontend: run, build, lint
  - Backend: run, environment variables
  - Folder structure
  - Notes on authentication & APIs
- Deployment
- Contributing
- License
- Contact

---

About
-----
MyFinance is a modern single-page application to help users manage personal finances. It provides dashboards for transactions, income, budgeting, and savings goals, plus profile management and email/password + social auth support (server includes Google auth helpers).

Key features
------------
- Dashboard overview of finances
- Transactions list and management
- Income tracking & charts
- Budget creation and visualization
- Savings goal tracking
- User profile + avatar upload
- Auth flows: register, login, forgot/reset password, email verification
- Responsive layout with sidebar and top bar

Screenshots / Demo
------------------
(Replace these placeholders with actual screenshots or a hosted demo link)
- Dashboard: screenshots/dashboard.png
- Transactions: screenshots/transactions.png
- Profile: screenshots/profile.png

For users — how to use
----------------------
1. Register a new account (or sign in with Google if enabled).
2. Add your income sources and transactions.
3. Create budgets and savings goals to track progress.
4. Use the dashboard views to monitor financial health and trends.

If a hosted demo is available, provide the link and a short “try me” username/password or demo mode instructions.

For developers — local setup & development
------------------------------------------

Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or cloud — e.g., Atlas)
- Optional: Vercel account if you want to deploy the front-end quickly

Repository overview
- Frontend: root (Vite + React)
  - Scripts: `dev`, `build`, `preview`, `lint`
  - Key packages: react, react-dom, react-router-dom, vite, @vitejs/plugin-react, oxlint
- Backend: `server/` (Express)
  - Scripts: `start`, `dev`
  - Key packages: express, mongoose, jsonwebtoken, bcryptjs, cookie-parser, dotenv, google-auth-library, nodemailer, multer, express-validator, express-rate-limit

Frontend — run locally
1. Install dependencies
   npm install
   (or) yarn

2. Set Vite client environment variables
   - Vite env variables must start with `VITE_`. Example `.env` in the frontend root:
     VITE_API_URL=http://localhost:5000/api
     VITE_CLIENT_URL=http://localhost:5173

3. Run dev server
   npm run dev
   - Opens at http://localhost:5173 by default (Vite). Visit that URL.

4. Build for production
   npm run build
   Preview the production build locally:
   npm run preview

5. Linting
   npm run lint
   - Project includes `oxlint` dev dependency for lint checks.

Backend — run locally
1. Change to the server folder and install:
   cd server
   npm install

2. Environment variables
   Create `server/.env` (or use `.env.example` as template). Typical variables the server expects:
   - PORT=5000
   - MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/myfinance?retryWrites=true&w=majority
   - JWT_SECRET=your_jwt_secret_here
   - JWT_EXPIRES_IN=7d
   - CLIENT_URL=http://localhost:5173
   - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS (for nodemailer)
   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (if Google auth enabled)
   - RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX (optional)

   Example (server/.env.example):
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/myfinance
   JWT_SECRET=replace_with_a_strong_secret
   CLIENT_URL=http://localhost:5173
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=your@example.com
   EMAIL_PASS=supersecret
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

   Note: adapt names/values to your environment. Do not commit secrets.

3. Start the server
   - Development (auto-restart on change): npm run dev
   - Production: npm start

4. Confirm the API
   - The server exposes REST endpoints used by the frontend (authentication, user profile, transactions, budgets, income, savings goals, etc.). To wire the frontend to the backend, point VITE_API_URL (or your chosen environment variable) to the server base URL (e.g., http://localhost:5000).

Folder structure (high-level)
-----------------------------
- / (root)
  - index.html
  - package.json (frontend)
  - vite.config.js
  - src/
    - main.jsx — React entry
    - App.jsx — Router + layout
    - App.css, index.css
    - components/ — shared components (AvatarUpload, charts, modals, ProtectedRoute...)
      - layout/Sidebar.jsx, TopBar.jsx
      - ui/ — smaller UI pieces
    - pages/ — DashboardPage.jsx, TransactionsPage.jsx, IncomeDashboardPage.jsx, BudgetDashboardPage.jsx, SavingsGoalDashboardPage.jsx, ProfilePage.jsx
    - pages/auth/ — LoginPage.jsx, RegisterPage.jsx, ForgotPasswordPage.jsx, ResetPasswordPage.jsx, VerifyEmailPage.jsx
    - context/ — AuthContext (auth state)
    - services/ — API wrappers (likely fetch/axios wrappers)
  - server/
    - server.js — Express app entry
    - package.json — server deps & scripts
    - config/, controllers/, models/, routes/, middleware/, validations/, utils/ — server code organization
    - .env.example — server env template
  - public/ — static assets
  - vercel.json — deployment config (Vercel)

Authentication & API notes
--------------------------
- The frontend includes an AuthContext and a ProtectedRoute component to protect app routes.
- The server uses JWT tokens and cookies for authentication (common pattern). The server has modules for email verification, password reset, and Google sign-in integration.
- File uploads (avatar) are handled with multer on the server.
- When setting up, ensure cookies and CORS are configured so the browser can talk to the API (CLIENT_URL / allowed origins).

Deployment
----------
- Frontend can be deployed to Vercel or any static host that supports SPA routing. There's a `vercel.json` already included.
- Server can be deployed to a Node host (Heroku, Railway, Render, DigitalOcean App Platform) or to serverless platforms with an appropriate adapter. Ensure environment variables and MongoDB connectivity are configured in the host.
- For Vite SPA routing on static hosts, configure rewrite rules so all routes serve index.html (Vercel config typically handles this).

Security & production checklist
-------------------------------
- Use strong JWT secret and rotate as required.
- Use HTTPS in production.
- Set secure cookie flags and sameSite attributes if using cookies for auth.
- Configure rate limiting (server already includes express-rate-limit).
- Sanitize and validate inputs (server includes express-validator).
- Do not commit .env with secrets.

Testing
-------
- No automated tests are present in the repo by default (add unit/integration tests as needed).
- Recommended: add Jest/React Testing Library for frontend, and supertest/mocha for backend API tests.

Contributing
------------
- Fork the repo and create feature branches.
- Follow project linting rules (run `npm run lint`).
- Open issues for bugs and feature requests. Submit PRs with clear descriptions and screenshots where relevant.

Useful commands
---------------
Frontend (root)
- Install: npm install
- Dev server: npm run dev
- Build: npm run build
- Preview build: npm run preview
- Lint: npm run lint

Server (server/)
- Install: npm install
- Dev: npm run dev
- Start: npm start

Troubleshooting
---------------
- If the frontend cannot contact the backend, verify VITE_API_URL (or equivalent) is correct and the server is running.
- If authentication fails, check cookies, CORS, and JWT_SECRET.
- For DB issues, verify MONGO_URI and that MongoDB is reachable.

License
-------
(Choose a license and insert it here; e.g., MIT)

Contact
-------
- Maintainer: Samuel (SAMUELinfinty)
- Repo: https://github.com/SAMUELinfinty/MyFinance

---

If you want, I can:
- Add example screenshots and host/demo instructions,
- Generate a precise `.env.example` based on the server code,
- Create CONTRIBUTING.md or a CODE_OF_CONDUCT file,
- Or open a PR with this README committed into the repo.
