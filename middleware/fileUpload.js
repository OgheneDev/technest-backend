import multer from 'multer';
import path from 'path';

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Choose destination based on file type
        const isProduct = req.baseUrl.includes('products');
        const uploadDir = isProduct ? './uploads/products' : './uploads/avatars';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Images only! Please upload a valid image file (jpeg, jpg, png, webp)'), false);
    }
};

// Create upload middleware
export const uploadSingle = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5000000 } // 5MB limit
}).single('image');

export const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5000000 }
}).array('images', 5); // Max 5 images
