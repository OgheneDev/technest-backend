export const handleMulterErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({
            success: false,
            error: `File upload error: ${err.message}`
        });
    } else if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    next();
};

// Apply to the route
