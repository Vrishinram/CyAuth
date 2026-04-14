const express = require('express');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { z } = require('zod');
const db = require('./database');

const router = express.Router();

// Validation Schemas
const registerSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(8)
});

const loginSchema = z.object({
    username: z.string(),
    password: z.string()
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = registerSchema.parse(req.body);
        
        // Check if user exists
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 12);

        // Insert user
        const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, password_hash);
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: err.errors ? err.errors[0].message : 'Invalid input' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = loginSchema.parse(req.body);

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // If 2FA enabled, don't set session yet, require 2FA verify
        if (user.is_two_factor_enabled) {
            req.session.tempUserId = user.id;
            return res.json({ require2FA: true });
        }

        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ message: 'Login successful', username: user.username });
    } catch (err) {
        res.status(400).json({ error: 'Invalid input' });
    }
});

// 2FA Setup
router.get('/2fa/setup', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const secret = speakeasy.generateSecret({ name: `CyAuth (${req.session.username})` });
    
    qrcode.toDataURL(secret.otpauth_url, (err, imageUrl) => {
        if (err) return res.status(500).json({ error: 'Error generating QR code' });
        
        // Temporarily store secret in session
        req.session.tempSecret = secret.base32;
        res.json({ secret: secret.base32, qrCode: imageUrl });
    });
});

// 2FA Enable (Verification)
router.post('/2fa/enable', (req, res) => {
    if (!req.session.userId || !req.session.tempSecret) return res.status(401).json({ error: 'Unauthorized' });

    const { token } = req.body;
    const isValid = speakeasy.totp.verify({ 
        secret: req.session.tempSecret,
        encoding: 'base32',
        token: token
    });

    if (!isValid) {
        return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Save secret to DB and enable 2FA
    db.prepare('UPDATE users SET two_factor_secret = ?, is_two_factor_enabled = 1 WHERE id = ?')
      .run(req.session.tempSecret, req.session.userId);

    delete req.session.tempSecret;
    res.json({ message: 'Two-factor authentication enabled' });
});

// 2FA Verify (During Login)
router.post('/2fa/verify', (req, res) => {
    const { token } = req.body;
    const userId = req.session.tempUserId;

    if (!userId) return res.status(401).json({ error: 'Session expired' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const isValid = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: token
    });

    if (!isValid) {
        return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Complete login
    req.session.userId = user.id;
    req.session.username = user.username;
    delete req.session.tempUserId;
    
    res.json({ message: 'Login successful', username: user.username });
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Could not log out' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// Profile
router.get('/profile', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const user = db.prepare('SELECT username, is_two_factor_enabled FROM users WHERE id = ?').get(req.session.userId);
    res.json(user);
});

module.exports = router;
