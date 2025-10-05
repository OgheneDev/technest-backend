import multer from 'multer';
import path from 'path';

// Use memory storage so we can upload buffers to Cloudinary
const storage = multer.memoryStorage();

// File filter (unchanged)
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

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5000000 } // 5MB
});

export const uploadSingleAvatar = upload.single('avatar');
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 10);
