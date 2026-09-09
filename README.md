# ExpenseMate

ExpenseMate is a shared-expense management and settlement platform built for friends, roommates, travel groups, and small communities. The app helps users record expenses, calculate balances automatically, and suggest simplified settlements without manual math.

## Features

- Secure user registration and login with JWT
- Group-based expense tracking
- Equal, exact, and percentage splits
- Centralized backend balance engine
- Settlement recording and suggestion logic
- Notifications and activity tracking
- Dashboard and financial summaries
- Responsive React frontend with a clean dashboard UI

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- Axios
- React Toastify
- Recharts

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Multer

## Project Structure

```text
ExpenseMate/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── index.html
├── README.md
└── .gitignore
```

## Requirements

- Node.js 18+
- MongoDB running locally or via MongoDB Atlas
- npm

## Installation

### 1. Clone the project

```bash
git clone <repo-url>
cd ExpenseMate
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

### Backend

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expensemate
JWT_SECRET=your_secure_secret
CLIENT_URL=http://localhost:5173
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

## MongoDB Setup

1. Install MongoDB on your machine or use a cloud MongoDB Atlas cluster.
2. Start MongoDB.
3. Ensure the connection string in the backend `.env` file points to the correct database.

## Running the Application

Start both servers:

- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

Access the app at: `http://localhost:5173`

## API Overview

The backend currently includes the auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Roles and Permissions

The application is designed around two permission layers:

- Platform Admin: platform-level administration
- Group Owner / Group Admin / Group Member: group-level permissions

The backend enforces authentication and authorization at the API layer.

## Balance Calculation Explanation

The backend is the source of truth for all financial calculations. Each expense contributes to each participant's share, total paid, and net balance. A settlement changes the group balance only when a real settlement record is created.

Positive net balance means a user should receive funds.
Negative net balance means a user owes funds.
Zero means the account is settled.

## Testing

```bash
cd backend
npm test

cd ../frontend
npm run build
```

## Deployment

- Build the frontend with `npm run build`.
- Start the backend with `npm start`.
- Serve the frontend build from a static host or a compatible deployment provider.
- Store environment variables securely and never commit secrets.

## Notes

This project is being implemented in phases. The foundation includes project setup, backend server, MongoDB connection, JWT auth, and the React app shell. The remaining financial and group features are the next implementation priority.
