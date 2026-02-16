const { createClient } = require('@supabase/supabase-js');

/**
 * fxd4 Engine - Database Connection (High Performance)
 * Location: core/config/Database.js
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Strict validation for production safety
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ fxd4 Error: SUPABASE_URL and SUPABASE_KEY are missing in .env file');
    process.exit(1);
}

/**
 * Singleton Pattern: Reuse the connection across serverless invocations.
 * This significantly reduces response time by avoiding repeated handshakes.
 */
if (!global.supabaseInstance) {
    global.supabaseInstance = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false, // Set to false for server-side only speed
            persistSession: false, 
            detectSessionInUrl: false
        },
        global: {
            headers: { 'x-application-name': 'fxd4.js' }
        },
        // Maximize pool and fetch performance
        db: {
            schema: 'public'
        }
    });
}

const supabase = global.supabaseInstance;

module.exports = supabase;