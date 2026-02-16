/**
 * DatabaseFeatureMiddleware - fxd4 Core Engine
 * Lokasi: core/Middleware/DatabaseFeatureMiddleware.js
 */
module.exports = (req, res, next) => {
    // Memastikan fitur database aktif (Default: true)
    const useSupabase = process.env.USE_SUPABASE !== 'false';

    if (!useSupabase) {
        // Log internal untuk debugger fxd4
        if (process.env.APP_DEBUG === 'true') {
            console.log('\x1b[33m[fxd4 Middleware]\x1b[0m: Access blocked to DB-dependent route.');
        }

        // Respons untuk request API atau AJAX
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
            return res.status(403).json({
                status: 'error',
                message: 'Database/Auth features are currently disabled in .env configuration.'
            });
        }

        // Respons tampilan untuk akses browser langsung
        return res.status(403).send(`
            <div style="font-family: -apple-system, system-ui, sans-serif; text-align: center; padding: 100px 20px;">
                <h1 style="font-size: 48px; margin-bottom: 10px;">403</h1>
                <h2 style="font-weight: 500;">Feature Disabled</h2>
                <p style="color: #666; max-width: 500px; margin: 0 auto 20px;">
                    This section requires <strong>Supabase</strong>. Please set <code>USE_SUPABASE=true</code> 
                    and provide your credentials in the <code>.env</code> file.
                </p>
                <a href="/" style="color: #000; text-decoration: none; font-weight: 600; border-bottom: 2px solid #000;">Return to Home</a>
            </div>
        `);
    }

    next();
};