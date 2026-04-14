# CyAuth

A full-stack authentication system with a Node.js backend and React frontend.

## Project Structure

```
CyAuth/
├── backend/          # Node.js Express server
│   ├── auth.js       # Authentication logic
│   ├── database.js   # Database configuration
│   ├── server.js     # Server entry point
│   └── package.json  # Backend dependencies
│
└── frontend/         # React application
    ├── src/
    │   ├── App.jsx   # Main App component
    │   ├── main.jsx  # Entry point
    │   └── assets/   # Static assets
    ├── public/       # Public files
    ├── package.json  # Frontend dependencies
    ├── vite.config.js# Vite configuration
    └── README.md     # Frontend documentation
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Features

- User authentication
- Database integration
- React-based frontend with Vite

## License

MIT
