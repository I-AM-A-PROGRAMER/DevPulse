# DevPulse — Real-Time Developer Learning Dashboard

A full-stack internal tool that tracks developer learning progress and integrates live data from the GitHub API. Built with a custom **MERN** (MongoDB, Express, React, Node.js) architecture featuring JWT authentication, Google OAuth, and real-time GitHub activity feeds.
---

## Features

- **Secure Authentication** — JWT-based login/register with bcrypt password hashing, plus Firebase Google OAuth
- **Developer Profiles** — Editable bios, skill lists, role tags, and avatar management stored in MongoDB
- **Live GitHub Integration** — Real-time activity feed, repository stats, and contributor data fetched from the GitHub API
- **Leaderboard** — Ranked scoring system based on commits, PRs, code reviews, streak days, skill levels, and courses completed
- **Daily Check-In System** — Track learning streaks with a 30-day activity heatmap
- **Goal Tracker** — Personal to-do list with add/complete/delete functionality
- **Team Directory** — View and browse all developer profiles on the platform
- **Dark Theme UI** — Premium onyx-black design with custom design tokens and smooth transitions

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI library |
| **TypeScript (TSX)** | Type-safe interfaces for Developer, Skill, Todo, and GitHub data models |
| **Vite** | Fast build tooling and dev server with HMR |
| **Tailwind CSS 4** | Utility-first CSS framework (via `@tailwindcss/vite` plugin) |
| **Firebase Auth** | Google Sign-In via `signInWithPopup` |
| **Lucide Icons** | SVG icon system |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express.js** | REST API framework |
| **MongoDB Atlas** | Cloud-hosted NoSQL database |
| **Mongoose** | ODM for schema definition and queries |
| **JWT (jsonwebtoken)** | Stateless authentication tokens |
| **bcryptjs** | Password hashing with salt rounds |
| **CORS** | Cross-Origin Resource Sharing middleware |
| **dotenv** | Environment variable management |

### DevOps & Tooling
| Technology | Purpose |
|---|---|
| **Git** | Version control |
| **Vercel** | Frontend deployment (static + serverless) |
| **Render** | Backend deployment (Node.js web service) |
| **Nodemon** | Auto-restart dev server on file changes |

---

## Project Structure

```
dpf/
├── backend/
│   ├── server.js            # Express server, Mongoose schemas, REST API, JWT auth
│   ├── package.json         # Backend dependencies
│   ├── .env                 # Environment variables (MONGO_URI, JWT_SECRET)
│   └── .env.example         # Template for required env vars
├── src/
│   ├── app/
│   │   ├── App.tsx          # Main application (dashboard, auth, GitHub feed, leaderboard)
│   │   └── components/      # UI component library
│   ├── firebase.ts          # Firebase config and Google Auth exports
│   ├── main.tsx             # React entry point
│   └── styles/
│       ├── globals.css      # Global styles
│       ├── tailwind.css     # Tailwind imports
│       ├── theme.css        # Design system tokens
│       └── fonts.css        # Typography
├── index.html               # HTML entry point with meta tags
├── vite.config.ts           # Vite configuration with React + Tailwind plugins
├── package.json             # Frontend dependencies
└── README.md                # This file
```

---

## Installation & Setup

### Prerequisites

- **Node.js** v18+ and **npm** v9+
- **MongoDB Atlas** account (or local MongoDB instance)
- **Firebase** project with Google Auth enabled
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/I-AM-A-PROGRAMER/DevPulse.git
cd DevPulse
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (use `.env.example` as reference):

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/devpulse
JWT_SECRET=<your-256-bit-secret>
```

Start the backend server:

```bash
npm run dev     # Development (with nodemon)
npm start       # Production
```

The server will start on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd ..           # Back to project root
npm install
```

Create a `.env` file in the project root (optional — defaults to localhost):

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend dev server:

```bash
npm run dev
```

The app will open on `http://localhost:5173`.

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register new developer | ✗ |
| `POST` | `/api/auth/login` | Login with email/password | ✗ |
| `POST` | `/api/auth/google` | Google OAuth login/register | ✗ |

### Developer Profiles
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/developers` | List all developers | ✗ |
| `POST` | `/api/developers` | Create developer (Google auto-register) | ✗ |
| `PUT` | `/api/developers/:id` | Update own profile | ✓ JWT |
| `DELETE` | `/api/developers/:id` | Delete own profile | ✓ JWT |

### External APIs
| API | Endpoints Used |
|-----|----------------|
| GitHub REST API v3 | `GET /users/:username`, `GET /users/:username/events`, `GET /users/:username/repos`, `GET /repos/:owner/:repo/contributors` |

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | Secret key for signing JWT tokens |

### Frontend (`.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API base URL (default: `http://localhost:5000/api`) |

---

## Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set the **Root Directory** to `.` (project root)
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `dist`
6. Add environment variable: `VITE_API_URL` = your Render backend URL

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Set the **Root Directory** to `backend`
3. Set **Build Command** to `npm install`
4. Set **Start Command** to `npm start`
5. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`

---

## Scripts

### Frontend
```bash
npm run dev     # Start Vite dev server with HMR
npm run build   # Build production bundle to /dist
```

### Backend
```bash
npm run dev     # Start with nodemon (auto-reload)
npm start       # Start production server
```

---

## License

This project is built as part of a Full-Stack Developer internship assessment. All rights reserved.
