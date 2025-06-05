import express from "express";
import { check } from "express-validator";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import { handleMulterErrors } from "../middleware/multer.js";
import { 
    register, 
    login, 
    getMe, 
    forgotPassword, 
    resetPassword, 
    updatePassword,
    deleteAccount,
    updateDetails
} from "../controllers/auth.controller.js";
import { uploadSingleAvatar } from "../middleware/fileUpload.js";

router.post(
    '/register',
    [
        (req, res, next) => {
            console.log("Request body before validation:", req.body);
            next();
        },
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    register
);

router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    login
);

router.get(
    '/me',
    protect,
    getMe
);

router.post('/forgotpassword', forgotPassword);

router.put(
    '/resetpassword/:resettoken',
    [
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    resetPassword
);

// New routes for user management
router.put(
    '/updatepassword',
    protect,
    [
        check('currentPassword', 'Current password is required').exists(),
        check('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 })
    ],
    updatePassword
);

router.put(
    '/updatedetails',
    protect,
    uploadSingleAvatar,
    handleMulterErrors,
    updateDetails
);


router.delete(
    '/deleteaccount',
    protect,
    [
        check('password', 'Password is required to confirm deletion').exists()
    ],
    deleteAccount
);

export const authRouter = router; 