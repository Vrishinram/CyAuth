const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./auth');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    credentials: true
}));
app.use(express.json());

// Session Management
app.use(session({
    secret: 'cyauth-super-secret-key-12345', // In production, use environment variables
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Routes
app.use('/api/auth', authRoutes);

// Status route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CyAuth Backend is running smoothly.' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
