/**
 * fxd4 Engine - Route Wrapper
 */
const catchAsync = require('./CatchAsync');

global.fxd4Routes = global.fxd4Routes || {};

const wrap = (router) => {
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
    
    methods.forEach((method) => {
        const originalMethod = router[method].bind(router);
        
        router[method] = (path, ...callbacks) => {
            const wrappedCallbacks = callbacks.map((callback) => {
                return typeof callback === 'function' ? catchAsync(callback) : callback;
            });

            // Daftarkan ke Express
            originalMethod(path, ...wrappedCallbacks);
            
            // Return object untuk chaining .name()
            // Kita return router agar setelah .name() user masih bisa melakukan chaining lain
            return {
                name: (routeName) => {
                    global.fxd4Routes[routeName] = path;
                    return router; 
                }
            };
        };
    });

    router.group = function(middlewares, callback) {
        const express = require('express');
        const groupRouter = wrap(express.Router({ mergeParams: true }));
        callback(groupRouter);
        this.use(middlewares, groupRouter);
    };

    return router;
};

module.exports = wrap;