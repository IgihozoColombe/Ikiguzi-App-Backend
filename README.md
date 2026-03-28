# Ikiguzi — Backend

AI-Powered Crop Cost & Market Price Tracker — REST API

Built with **Node.js**, **Express**, and **MongoDB**.

---

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcrypt (password hashing)
- Helmet (security headers)
- Morgan (request logging)
- CORS

---

## Prerequisites

Make sure you have these installed before starting:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) — local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- npm v9 or higher

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/[your-username]/ikiguzi.git
cd ikiguzi/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

Create a `.env` file in the `backend/` folder:

```bash
cp .env.example .env
```

Then open `.env` and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ikiguzi
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174
```

If using MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ikiguzi
```

### 4. Start the development server

```bash
npm run dev
```

The server will start at: **http://localhost:5000**

Health check: **http://localhost:5000/api/health**

---

## API Endpoints

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Check if server is running |

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register a new farmer account |
| POST | `/api/auth/login` | None | Login and receive JWT token |
| POST | `/api/auth/logout` | JWT | Logout |

### Crops — `/api/crops`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/crops` | JWT | Get all crops for logged-in user |
| POST | `/api/crops` | JWT | Add a new crop |
| PUT | `/api/crops/:id` | JWT | Update a crop |
| DELETE | `/api/crops/:id` | JWT | Delete a crop |

### Costs — `/api/costs`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/costs/:cropId` | JWT | Get all cost records for a crop |
| POST | `/api/costs` | JWT | Add a cost record (auto-calculates total) |
| PUT | `/api/costs/:id` | JWT | Update a cost record |
| DELETE | `/api/costs/:id` | JWT | Delete a cost record |

### Predictions — `/api/predictions`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/predictions/:cropId` | JWT | Get AI price prediction for a crop |

### Alerts — `/api/alerts`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/alerts` | JWT | Get all alerts for logged-in user |
| PATCH | `/api/alerts/:id/read` | JWT | Mark an alert as read |

### Reports — `/api/reports`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reports/export` | JWT | Export cost and profit data |

---

## Project Structure

```
backend/
├── routes/
│   ├── auth.js           # Register, login, logout
│   ├── crops.js          # Crop CRUD
│   ├── costs.js          # Cost record CRUD
│   ├── predictions.js    # AI price prediction
│   ├── alerts.js         # Alerts / notifications
│   └── reports.js        # Report export
├── models/               # Mongoose schemas
├── middleware/            # JWT auth middleware
├── app.js                # Express app factory (createApp)
├── server.js             # Entry point
├── .env.example
└── package.json


## Available Scripts

npm run dev       # Start development server with hot reload (nodemon)
npm run start     # Start production server
npm run lint      # Run ESLint

