import fs from 'fs';
import path from 'path';

const createUploadDirs = () => {
    const dirs = [
        './uploads',
        './uploads/products',
        './uploads/avatars'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
};

createUploadDirs();
