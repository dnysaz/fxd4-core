require('dotenv').config();
const express = require('express');
const hbs = require('hbs');
const cookieParser = require('cookie-parser');
const path = require('path');
const supabase = require('../config/Database'); // Mengarah ke core/config/Database.js

const app = express();

/**
 * fxd4 Engine - Server Core
 * Lokasi: core/app/Server.js
 * Optimized by Ketut Dana
 */

// Menentukan root directory (naik 2 tingkat dari core/app)
const rootDir = path.join(__dirname, '../../');

// --- HANDLEBARS HELPERS ---
hbs.registerHelper('set', function (name, value, options) {
    if (!this._sections) this._sections = {};
    this._sections[name] = value;
    return null;
});

hbs.registerHelper('get', function (name, options) {
    return this._sections ? this._sections[name] : options.hash.default;
});

hbs.registerHelper('slice', function (str, start, end) {
    if (str && typeof str === 'string') {
        return str.slice(start, end);
    }
    return '';
});

// --- LIVERELOAD SETUP ---
if (process.env.APP_DEBUG === 'true') {
    const livereload = require("livereload");
    const connectLiveReload = require("connect-livereload");

    const liveReloadServer = livereload.createServer();
    // Watch folder di root
    liveReloadServer.watch(path.join(rootDir, 'views'));
    liveReloadServer.watch(path.join(rootDir, 'public'));

    app.use(connectLiveReload());

    liveReloadServer.server.once("connection", () => {
        setTimeout(() => {
            liveReloadServer.refresh("/");
        }, 100);
    });
}

// --- VIEW ENGINE CONFIGURATION ---
app.set('view engine', 'hbs');
app.set('views', path.join(rootDir, 'views'));
app.set('view options', { layout: 'layouts/app' });

// Registrasi Partials & Components di root
hbs.registerPartials(path.join(rootDir, 'views/partials'));
hbs.registerPartials(path.join(rootDir, 'views/components')); 

// --- MIDDLEWARES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(rootDir, 'public')));

// Performance Optimization: View Cache in Production
if (process.env.APP_DEBUG !== 'true') {
    app.enable('view cache');
}

/**
 * GLOBAL MIDDLEWARE (High Performance Optimized)
 * Lokasi: core/app/Server.js
 */
app.use((req, res, next) => {
    const start = process.hrtime();

    res.locals.supabaseActive = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
    res.locals.useSupabase = process.env.USE_SUPABASE !== 'false';

    res.locals.appName = process.env.APP_NAME || 'fxd4.js';
    res.locals.appVersion = process.env.APP_VERSION || '0.0.0';

    // Timer Execution
    const originalRender = res.render;
    res.render = function (view, options, callback) {
        const diff = process.hrtime(start);
        const duration = (diff[0] + diff[1] / 1e9).toFixed(3);
        res.locals.renderTime = duration;
        originalRender.call(this, view, options, callback);
    };
    
    const token = req.cookies.fxd4_session;
    res.locals.user = null;
    res.locals.globalUser = null;

    // Global state middleware (Local JWT Decode)
    if (token) {
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const base64Url = parts[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(Buffer.from(base64, 'base64').toString());

                const metadata = payload.user_metadata || payload.metadata || {};
                
                // 1. GLOBAL STATE: Untuk Navbar agar tampilannya bersih
                res.locals.globalUser = {
                    name: metadata.full_name || null,
                    email: payload.email
                };

                // 2. PENTING: Untuk AuthMiddleware agar bisa masuk ke Dashboard
                res.locals.user = payload; 
            }
        } catch (err) {
            res.locals.globalUser = null;
            res.locals.user = null;
        }
    }
    next();
});

// --- ROUTES ---
const webRoutes = require(path.join(rootDir, 'routes/web'));
app.use('/', webRoutes);

// --- 404 CATCHER ---
// Jika request sampai ke sini, berarti tidak ada route yang cocok di atas
app.use((req, res, next) => {
    const err = new Error(`The path "${req.originalUrl}" was not found.`);
    err.status = 404;
    next(err); 
});

// --- ERROR HANDLING ---
// Middleware ini harus selalu menjadi yang terakhir
const exceptionHandler = require('../middleware/ExceptionHandler'); 
app.use(exceptionHandler);

/**
 * SERVER STARTING
 */
const startServer = () => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 fxd4 framework running at http://localhost:${PORT}`);
        console.log(`Authentically built by Ketut Dana`);
    });
};

module.exports = { app, startServer };