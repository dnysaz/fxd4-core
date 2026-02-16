/**
 * DatabaseFeatureMiddleware - fxd4 Core Engine
 */
module.exports = (req, res, next) => {
    const useSupabase = process.env.USE_SUPABASE === 'true';

    if (!useSupabase) {
        // Kita buat Error object
        const error = new Error('Forbidden');
        error.status = 403;
        
        /**
         * Pesan instruksi kamu tetap ada di sini.
         * Ini akan ditangkap oleh ExceptionHandler dan ditampilkan ke user.
         */
        error.statusText = `This section requires <strong>Supabase</strong>. 
            Please set <code>USE_SUPABASE=true</code> and provide your credentials 
            in the <code>.env</code> file.`;

        // Lempar ke central error handler
        return next(error);
    }

    next();
};