# URLytics Project Documentation

URLytics is a premium, self-hosted URL shortener application equipped with real-time visitor analytics, geolocation lookup, access controls (expiration & password protection), and a sleek modern dashboard interface.

This project is a part of a hackathon run by https://katomaran.com.

---

## Project Explanation Video
Watch the comprehensive video walkthrough demonstrating the project structure, features, and implementation:
[URLytics Project Explanation & Feature Walkthrough](https://drive.google.com/file/d/1_Sro_lF-zvguos27NHhFe5K69E9abhlL/view?usp=drive_link)

---

## Table of Contents
1. [Core Features](#core-features)
2. [Project Directory Structure](#project-directory-structure)
3. [Technical Architecture & Diagrams](#technical-architecture--diagrams)
4. [AI Planning Document](#ai-planning-document)
5. [Assumptions Made](#assumptions-made)
6. [Database Schema Design](#database-schema-design)
7. [Local Development Setup](#local-development-setup)
8. [Deployment & CI/CD Pipeline](#deployment--cicd-pipeline)
9. [Key Troubleshooting & Resolutions](#key-troubleshooting--resolutions)

---

## Core Features

- **Link Builder & Customizer:** 
  - Shorten any long URL with automatically generated 6-character random codes.
  - Set custom readable aliases (e.g., `/r/promo2026`).
  - Add friendly titles to organize links.
- **Link Status Control:** 
  - A dashboard power switch allows links to be instantly activated or paused (disabled) in real-time.
- **Access Expiration:** 
  - Set a date-time boundary after which the link automatically expires and denies redirects.
- **Security & Protection:** 
  - Password-protect sensitive links. The backend securely checks bcrypt hashes, and the frontend displays a sleek, secure unlock portal.
- **Interactive Analytics Dashboard:**
  - **Clicks Timeline:** Visualized with an interactive, glowing line chart displaying daily trends.
  - **Audience Tech:** Breakdown of visitors' devices (Desktop, Mobile, Tablet) and browser types.
  - **Geolocation Mapping:** Resolves incoming visitor IPs to countries and cities in the background using free geolocation lookup.
  - **Data Export:** Export complete click analytics to CSV format directly from the dashboard.
- **Modern Responsive Design:** 
  - Rich aesthetics utilizing custom HSL color systems, glassmorphism, responsive sidebar toggle, and custom glowing sonar-pulse loading animations.

---

## Project Directory Structure

```text
URLytics/
├── .github/
│   └── workflows/
│       └── main.yml           # GitHub Actions CI/CD deployment pipeline
├── server/                    # Node.js / Express Backend API
│   ├── config/                # Database connection settings (db.js)
│   ├── controllers/           # Route logic (auth, URLs, analytics, redirects)
│   ├── middleware/            # JWT authentication & custom rate limiters
│   ├── models/                # MongoDB Mongoose schemas (User, Url, Click)
│   ├── routes/                # Express routing definitions
│   ├── Dockerfile             # Production container definition for backend
│   ├── index.js               # Application entrypoint & Express server
│   └── package.json           # Backend dependencies list
├── src/                       # React / Vite Frontend Application
│   ├── assets/                # Images and static graphic assets
│   ├── components/            # Shared UI components (common/Navbar, common/Sidebar)
│   ├── layouts/               # Page templates (DashboardLayout)
│   ├── pages/                 # Full screen page views (Dashboard, AuthPage, LandingPage)
│   ├── routes/                # Client routing logic (AppRoutes, ProtectedRoute)
│   ├── services/              # API fetch requests abstraction
│   ├── styles/                # CSS custom style definitions (global.css)
│   ├── App.jsx                # Main application component & auth initializer
│   └── main.jsx               # React entrypoint mapping
├── Dockerfile.frontend        # Production container definition for frontend
├── index.html                 # Main HTML root document
├── package.json               # Frontend dependencies list
├── vite.config.js             # Vite bundler configurations
└── .env                       # Local environment configurations (ignored by git)
```

---

## Technical Architecture & Diagrams

URLytics is built on a decoupled MERN-like stack using Node/Express for the backend API and React/Vite for the frontend client.

### Redirection & Click Logging Lifecycle
The sequence diagram below details how the redirection traffic flows between components:

```mermaid
sequenceDiagram
    autonumber
    actor Visitor
    participant Frontend as URLytics React SPA
    participant Backend as URLytics Express API
    participant DB as MongoDB Atlas

    Visitor->>Backend: GET /r/:shortCode (Clicks short link)
    Backend->>DB: Find URL record by shortCode
    DB-->>Backend: Return URL metadata (active status, password hash, expiration)
    
    alt Link is Disabled
        Backend-->>Visitor: 302 Redirect to Frontend/?error=link_disabled
    else Link has Expired
        Backend-->>Visitor: 302 Redirect to Frontend/?error=link_expired
    else Link is Password Protected
        Backend-->>Visitor: 302 Redirect to Frontend/?unlock=shortCode
        Visitor->>Frontend: Enters password in unlock screen
        Frontend->>Backend: POST /r/:shortCode/unlock { password }
        Backend->>DB: Query URL and compare bcrypt hash
        alt Valid Password
            Backend-->>Frontend: Return longUrl (Logs click in background)
            Frontend-->>Visitor: Redirects browser (window.location.href = longUrl)
        else Invalid Password
            Backend-->>Frontend: Return 401 Unauthorized
        end
    else Link is Active & Unprotected
        Note over Backend: Geolocation (ip-api) & User-Agent parsing runs in background
        Backend->>DB: Create Click record & increment URL clicksCount
        Backend-->>Visitor: 302 Redirect to target longUrl
    end
```

### Component Structure
- **Frontend SPA (Vite + React):**
  - **Routing:** Handled via React Router (AppRoutes.jsx). Route access is controlled using authentication guards (ProtectedRoute.jsx).
  - **API Services:** Built as pure JavaScript async calls (authService.js, urlService.js) pointing to the base API endpoint.
- **Backend API (Node + Express):**
  - **Rate Limiting:** Enforces request quotas for redirects and API access separately to prevent spam.
  - **CORS:** Enabled globally to allow cross-origin requests from the React application domain.

---

## AI Planning Document

This section outlines the planning and implementation checklist executed by the AI assistant to stabilize the database connection and fix production redirection issues:

### Phase 1: Connection Troubleshooting
- [x] DNS Investigation: Discovered that the standard `mongodb+srv://` URI failed with `querySrv ECONNREFUSED` inside the Node.js process despite system-level resolution working.
- [x] SRV Mapping: Traced raw SRV mapping configurations and database host replica sets using `nslookup`.
- [x] Connection Migration: Updated the `.env` configuration to use the standard `mongodb://` connection string specifying the replica set shards and authSource.
- [x] Data Validation: Verified connectivity by running a test query showing that the original `test` database was successfully accessed (containing existing users).

### Phase 2: Redirection Flow Fixes
- [x] Link Generation Update: Modified `Dashboard.jsx` to construct short link URLs using the backend URL (`import.meta.env.VITE_API_URL`) instead of `window.location.origin`, making sure redirects hit the Express server.
- [x] Cross-Origin Redirect Handler: Added support for a `FRONTEND_URL` configuration in the backend's `redirectController.js` to redirect error states (`?error=...`) and password checks (`?unlock=...`) back to the React client's domain.
- [x] Password Post Pathing: Adjusted `PasswordUnlockPage.jsx` to call the password unlock route on the API server base instead of the relative client path.

### Phase 3: Visual Polish & UI Enhancements
- [x] Loading Spinner Redesign: Replaced the default loading line-spinner with a glowing, pulse-ring sonar CSS loader (`pulse-core` and `pulse-ring` keyframes).
- [x] Modal Label Simplification: Removed redundant icons (Pencil, Clock, Shield, Power) from the Edit Modal's titles and form labels.
- [x] Horizontal Switch Alignment: Formatted the Link Status row to display inline, aligned horizontally, and styled the active state in signature purple.
- [x] Modal Password Removal: Resolved an update bug by using `null` values to successfully command the backend to remove password protection.

---

## Assumptions Made

1. **DNS Environment Limitations:** We assumed that raw DNS UDP port 53 lookup is blocked or filtered specifically for Node.js runtimes in the current environment (while passing system calls like `getaddrinfo` through), necessitating standard `mongodb://` connection formatting.
2. **Decoupled Architecture:** We assumed the frontend and backend are deployed as isolated services on different domains in production (e.g. Render Web Service for Express API and Render Static Site for the Vite React SPA). This required modifying local relative redirects to use absolute `FRONTEND_URL` and `VITE_API_URL` settings.
3. **Database Selection:** We assumed the `test` database contains the primary hackathon data (based on the user's database snapshot) and configured connection strings to target `/test` instead of `/urlytics`.
4. **Interactive Modal Dismissal:** We assumed that the closing `X` button on the Edit Modal is a core UX control and kept it while removing other purely decorative form label icons.

---

## Database Schema Design

The application utilizes MongoDB to store records. The collection schemas are defined as follows:

### 1. User Schema
Stores registered user information and configuration flags.
- `email` (String, required, unique, lowercase, trimmed)
- `passwordHash` (String, required)
- `name` (String, default: `""`)
- `phone` (String, default: `""`)
- `profilePicture` (String, default: `""`)
- `smsAlerts` (Boolean, default: `false`)
- `createdAt` (Date, default: `Date.now`)

### 2. Url Schema
Stores the mappings of short codes to destination target URLs.
- `title` (String, required, trimmed)
- `longUrl` (String, required, trimmed)
- `shortCode` (String, required, unique, indexed)
- `userId` (ObjectId referencing `User`, required)
- `clicksCount` (Number, default: `0`)
- `expiresAt` (Date, default: `null`)
- `isActive` (Boolean, default: `true`)
- `password` (String, default: `null` - stores bcrypt hashed password)
- `createdAt` (Date, default: `Date.now`)

### 3. Click Schema
Stores visitor analytics for audit and reporting.
- `urlId` (ObjectId referencing `Url`, required)
- `ip` (String, required)
- `referrer` (String, default: `"Direct"`)
- `userAgent` (String, default: `"unknown"`)
- `device` (String, default: `"Desktop"`)
- `browser` (String, default: `"Unknown"`)
- `country` (String, default: `"Unknown"`)
- `city` (String, default: `"Unknown"`)
- `timestamp` (Date, default: `Date.now`)

---

## Local Development Setup

### Prerequisites
- Node.js (version 20 or higher)
- A running MongoDB instance (or Atlas cluster)

### Environment Configurations
Create a `.env` file at the root of the project (`/URLytics/.env`) containing the following variables:

```env
# MongoDB Connection String (use standard connection string format)
MONGODB_URI=mongodb://username:password@shard-00.mongodb.net:27017,shard-01.mongodb.net:27017/test?ssl=true&replicaSet=your-replica-set&authSource=admin

# Secret key for signing JWT tokens
JWT_SECRET=urlytics_jwt_super_secret_key_12345

# Port for backend Express server
PORT=5000

# Frontend React URL (used for backend redirections)
FRONTEND_URL=http://localhost:5173
```

### Installation Steps

1. **Install Dependencies:**
   Run from the project root directory:
   ```bash
   # Install root and frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

2. **Start Backend Server:**
   ```bash
   cd server
   node index.js
   ```
   *The server runs on http://localhost:5000.*

3. **Start Frontend Client:**
   In a separate terminal from the root directory:
   ```bash
   npm run dev
   ```
   *The client runs on http://localhost:5173.*

---

## Deployment & CI/CD Pipeline

The project features a fully automated CI/CD pipeline using GitHub Actions and Docker to deploy containers to Render.

### Docker Configuration
- **Frontend (Dockerfile.frontend):** Builds a lightweight production bundle using Node and serves it static via the `serve` library. Accepts the build-time argument `VITE_API_URL`.
- **Backend (server/Dockerfile):** Copies Express source code and launches the node runtime.

### GitHub Actions Workflow (main.yml)
On every push to the `main` branch, the workflow triggers:
1. Logs into Docker Hub.
2. Compiles the frontend Docker image passing `${{ secrets.VITE_API_URL }}` as a build-time argument and pushes it to Docker Hub.
3. Builds the backend Docker image and pushes it.
4. Triggers deploy hooks on Render to pull the latest images and redeploy.

### Required Environment Settings in Production

For production redirection to function correctly, make sure these environment settings are configured:

| Component | Configuration Location | Key | Value | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend SPA (Vite)** | GitHub Secrets | `VITE_API_URL` | `https://urlytics-api.onrender.com` | Directs API requests and short links to the backend server. |
| **Backend API (Express)** | Render Environment Variables | `FRONTEND_URL` | `https://urlytics-1.onrender.com` | Redirects visitors back to the frontend domain for passwords/errors. |

---

## Key Troubleshooting & Resolutions

### 1. MongoDB Connection Error: `querySrv ECONNREFUSED`
*   **Cause:** Node.js's internal DNS resolver (`c-ares`) fails to query raw SRV records (`mongodb+srv://...`) over UDP port 53 due to local network or firewall restrictions.
*   **Resolution:** Switch the connection URI in `.env` to the standard `mongodb://` replica set format (specifying individual shard hosts, ports, replicaSet name, and authSource). This routes host resolution through the OS's native `getaddrinfo` system call, bypassing the block.

### 2. Redirections leading to 404 / Backend root page
*   **Cause:** The frontend short URL was constructed using `window.location.origin` (static client server) which cannot handle short links, or backend relative redirects landed on the backend API root instead of returning the visitor to the React app.
*   **Resolution:** Modified the frontend to generate short links using `VITE_API_URL` so that they hit the backend engine, and modified backend controllers to prefix redirects with `FRONTEND_URL` in production.

### 3. Password Removal fails to persist
*   **Cause:** Omit-checks on empty strings (`''`) in update requests prevented the frontend from telling the backend to clear the password parameter.
*   **Resolution:** Implemented explicit `null` signaling. Setting the password input to `null` sends a clear instruction to the database to remove protection.

---

This project is a part of a hackathon run by https://katomaran.com
