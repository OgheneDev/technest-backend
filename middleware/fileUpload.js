import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const ensureDir = (dir) => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    } catch (err) {
        console.error(`Failed to create directory ${dir}:`, err);
        throw new Error(`Failed to create upload directory: ${err.message}`);
    }
};

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isProduct = req.baseUrl.includes('products');
        const uploadDir = isProduct ? './uploads/products' : './uploads/avatars';
        try {
            ensureDir(uploadDir);
            cb(null, uploadDir);
        } catch (err) {
            cb(err, null);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Fix: originalName -> originalname
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
 
// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    // Fix: originalName -> originalname
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Images only! Please upload a valid image file (jpeg, jpg, png, webp)'), false);
    }
};

// Create base multer instance
export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5000000 } // 5MB limit
});

// Specific middleware for user avatar uploads
export const uploadSingleAvatar = upload.single('avatar'); // Matches frontend field name

// Specific middleware for product image uploads
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 10); // Max 10 images