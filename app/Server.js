const path = require('path');
const rootDir = path.join(__dirname, '../../');

// 1. LOAD DOTENV PERTAMA KALI
require('dotenv').config({ path: path.join(rootDir, '.env') });

const express = require('express');
const hbs = require('hbs');
const cookieParser = require('cookie-parser');
const { registerHelpers } = require('./Helper');

const app = express();

/**
 * fxd4 Engine - Server Core
 * Optimized by Ketut Dana
 */

// --- INITIALIZE HELPERS ---
// Harus sebelum rute agar global.fxd terdefinisi
registerHelpers();

// --- LIVERELOAD SETUP ---
if (process.env.APP_DEBUG === 'true') {
    const livereload = require("livereload");
    const connectLiveReload = require("connect-livereload");
    const liveReloadServer = livereload.createServer();
    liveReloadServer.watch(path.join(rootDir, 'views'));
    liveReloadServer.watch(path.join(rootDir, 'public'));
    app.use(connectLiveReload());
    liveReloadServer.server.once("connection", () => {
        setTimeout(() => liveReloadServer.refresh("/"), 100);
    });
}

// --- VIEW ENGINE CONFIGURATION ---
app.set('view engine', 'hbs');
app.set('views', path.join(rootDir, 'views'));
app.set('view options', { layout: 'layouts/app' });
hbs.registerPartials(path.join(rootDir, 'views/partials'));
hbs.registerPartials(path.join(rootDir, 'views/components')); 

// --- MIDDLEWARES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(rootDir, 'public')));

if (process.env.APP_DEBUG !== 'true') {
    app.enable('view cache');
}

/**
 * GLOBAL MIDDLEWARE (State & Timer)
 */
app.use((req, res, next) => {
    const start = process.hrtime();
    
    // Inject Global Variables to Views
    res.locals.supabaseActive = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
    res.locals.useSupabase = process.env.USE_SUPABASE !== 'false';
    res.locals.appName = process.env.APP_NAME || 'fxd4.js';
    res.locals.appVersion = process.env.APP_VERSION || '0.0.0';

    // Performance Profiler Helper
    const originalRender = res.render;
    res.render = function (view, options, callback) {
        const diff = process.hrtime(start);
        res.locals.renderTime = (diff[0] + diff[1] / 1e9).toFixed(3);
        originalRender.call(this, view, options, callback);
    };
    
    // JWT Session Decoder
    const token = req.cookies.fxd4_session;
    res.locals.user = null;
    res.locals.globalUser = null;

    if (token) {
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            const metadata = payload.user_metadata || {};
            res.locals.globalUser = { name: metadata.full_name, email: payload.email };
            res.locals.user = payload; 
        } catch (err) { /* Silent fail */ }
    }
    next();
});

// --- ROUTES ---
app.use('/', require(path.join(rootDir, 'routes/web')));

// --- 404 CATCHER ---
app.use((req, res, next) => {
    const err = new Error(`The path "${req.originalUrl}" was not found.`);
    err.status = 404;
    next(err); 
});

// --- ERROR HANDLING (DUMP INTERCEPTOR) ---
// Harus di bawah app.use('/', webRoutes) agar menangkap error dari controller
app.use(require('../middleware/ExceptionHandler')); 

/**
 * SERVER STARTING
 */
const startServer = () => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 fxd4 running at http://localhost:${PORT}`);
        console.log(`Authentically built by Ketut Dana`);
    });
};

module.exports = { app, startServer };