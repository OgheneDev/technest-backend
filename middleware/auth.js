import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// Protect routes 
export const protect = async (req, res, next) => {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route: No token provided'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route: Invalid token payload'
            });
        }

        // Fetch user
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route: User not found'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Protect middleware error:', err);
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route: Token verification failed'
        });
    }
};

// Grant access to specific roles
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'User role is not authorized to access this route'
            });
        }
        next();
    };
};