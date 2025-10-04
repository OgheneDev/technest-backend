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

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
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

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user's profile
 * @access  Private
 */
router.get(
    '/me',
    protect,
    getMe
);

/**
 * @route   POST /api/auth/forgotpassword
 * @desc    Initiate password reset and send email
 * @access  Public
 */
router.post('/forgotpassword', forgotPassword);

/**
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @desc    Reset user password using provided token
 * @access  Public
 */
router.put(
    '/resetpassword/:resettoken',
    [
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    resetPassword
);

/**
 * @route   PUT /api/auth/updatepassword
 * @desc    Update authenticated user's password
 * @access  Private
 */
router.put(
    '/updatepassword',
    protect,
    [
        check('currentPassword', 'Current password is required').exists(),
        check('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 })
    ],
    updatePassword
);

/**
 * @route   PUT /api/auth/updatedetails
 * @desc    Update authenticated user's details (firstName, lastName, phoneNumber, avatar)
 * @access  Private
 */
router.put(
    '/updatedetails',
    protect,
    uploadSingleAvatar,
    handleMulterErrors,
    updateDetails
);

/**
 * @route   DELETE /api/auth/deleteaccount
 * @desc    Delete authenticated user's account after password confirmation
 * @access  Private
 */
router.delete(
    '/deleteaccount',
    protect,
    [
        check('password', 'Password is required to confirm deletion').exists()
    ],
    deleteAccount
);

export const authRouter = router;