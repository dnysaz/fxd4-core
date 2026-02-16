const supabase = require('../config/Database');

// Global cache storage to persist across requests (useful for Vercel warm containers)
global.fxd4Cache = global.fxd4Cache || {};

/**
 * fxd4 Engine - BaseModel (Eloquent Style with High Performance Cache)
 * Location: core/model/BaseModel.js
 */
class BaseModel {
    constructor(tableName) {
        this.table = tableName;
        this.queryInstance = null;
        this.cacheTTL = 10000; // 10 seconds cache duration
    }

    /**
     * Initialize query builder
     */
    _initQuery() {
        if (!this.queryInstance) {
            this.queryInstance = supabase.from(this.table).select('*');
        }
        return this.queryInstance;
    }

    /**
     * Internal helper to handle cache clearing
     */
    _clearTableCache() {
        const keys = Object.keys(global.fxd4Cache);
        keys.forEach(key => {
            if (key.startsWith(`${this.table}:`)) {
                delete global.fxd4Cache[key];
            }
        });
    }

    // --- FETCH METHODS ---

    async get() {
        try {
            const query = this._initQuery();
            const { data, error } = await query;
            this.queryInstance = null;
            if (error) throw error;
            return data;
        } catch (error) {
            this.queryInstance = null;
            throw error;
        }
    }

    async first() {
        const cacheKey = `${this.table}:first:${JSON.stringify(this.queryInstance)}`;
        const now = Date.now();

        // Return from cache if available and not expired
        if (global.fxd4Cache[cacheKey] && (now - global.fxd4Cache[cacheKey].time < this.cacheTTL)) {
            this.queryInstance = null;
            return global.fxd4Cache[cacheKey].data;
        }

        try {
            const query = this._initQuery();
            const { data, error } = await query.single();
            this.queryInstance = null;
            
            if (error && error.code !== 'PGRST116') throw error;
            
            const result = data || null;
            // Store successful result in cache
            global.fxd4Cache[cacheKey] = { data: result, time: now };
            
            return result;
        } catch (error) {
            this.queryInstance = null;
            throw error;
        }
    }

    async all() {
        return await this.get();
    }

    async find(id) {
        const cacheKey = `${this.table}:id:${id}`;
        const now = Date.now();

        // Instant return for finding by ID
        if (global.fxd4Cache[cacheKey] && (now - global.fxd4Cache[cacheKey].time < this.cacheTTL)) {
            return global.fxd4Cache[cacheKey].data;
        }

        const data = await this.where('id', id).first();
        
        if (data) {
            global.fxd4Cache[cacheKey] = { data: data, time: now };
        }
        
        return data;
    }

    // --- FILTER METHODS (CHAINABLE) ---

    where(column, value) {
        this._initQuery().eq(column, value);
        return this;
    }

    whereIn(column, values) {
        this._initQuery().in(column, values);
        return this;
    }

    whereOr(filterString) {
        this._initQuery().or(filterString);
        return this;
    }

    orderBy(column, { ascending = true } = {}) {
        this._initQuery().order(column, { ascending });
        return this;
    }

    limit(count) {
        this._initQuery().limit(count);
        return this;
    }

    // --- ACTION METHODS ---

    async create(payload) {
        this.queryInstance = null;
        const { data, error } = await supabase
            .from(this.table)
            .insert([payload])
            .select()
            .single();
        
        if (error) throw error;
        this._clearTableCache(); // Bust cache on change
        return data;
    }

    async update(id, payload) {
        this.queryInstance = null;
        const { data, error } = await supabase
            .from(this.table)
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        this._clearTableCache(); // Bust cache on change
        return data;
    }

    async delete(id) {
        this.queryInstance = null;
        const { error } = await supabase
            .from(this.table)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        this._clearTableCache(); // Bust cache on change
        return true;
    }

    async findBy(column, value) {
        return await this.where(column, value).first();
    }

    query() {
        this.queryInstance = null;
        return supabase.from(this.table);
    }
}

module.exports = BaseModel;