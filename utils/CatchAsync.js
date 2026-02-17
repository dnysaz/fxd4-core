/**
 * fxd4 Engine - Async Wrapper
 * Optimized for Dot Notation in Views & Layouts
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        const process = {
            req,
            res,
            body: req.body,
            params: req.params,
            query: req.query,
            user: res.locals.user,
            
            // Render Helper: Sekarang mendukung dot notation untuk View DAN Layout
            render: (view, data = {}) => {
                const viewPath = view.replace(/\./g, '/');
                
                // Jika user menentukan layout di dalam data, perbaiki juga titiknya
                if (data.layout && typeof data.layout === 'string') {
                    data.layout = data.layout.replace(/\./g, '/');
                }
                
                return res.render(viewPath, data);
            },
            
            redirect: (target) => {
                const namedRoute = global.fxd4Routes ? global.fxd4Routes[target] : null;
                return res.redirect(namedRoute || target);
            },
            
            get error() { return true; }
        };

        Promise.resolve(fn(process)).catch(next);
    };
};

module.exports = catchAsync;