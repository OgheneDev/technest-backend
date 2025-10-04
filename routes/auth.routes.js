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
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               adminCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created and token returned
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
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authenticated and token returned
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
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current logged in user's profile
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned
 */
router.get(
    '/me',
    protect,
    getMe
);

/**
 * @openapi
 * /api/auth/forgotpassword:
 *   post:
 *     summary: Initiate password reset and send email
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent
 */
router.post('/forgotpassword', forgotPassword);

/**
 * @openapi
 * /api/auth/resetpassword/{resettoken}:
 *   put:
 *     summary: Reset user password using provided token
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: resettoken
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset and token returned
 */
router.put(
    '/resetpassword/:resettoken',
    [
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    resetPassword
);

/**
 * @openapi
 * /api/auth/updatepassword:
 *   put:
 *     summary: Update authenticated user's password
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated and new token returned
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
 * @openapi
 * /api/auth/updatedetails:
 *   put:
 *     summary: Update authenticated user's details (firstName, lastName, phoneNumber, avatar)
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated user returned
 */
router.put(
    '/updatedetails',
    protect,
    uploadSingleAvatar,
    handleMulterErrors,
    updateDetails
);

/**
 * @openapi
 * /api/auth/deleteaccount:
 *   delete:
 *     summary: Delete authenticated user's account after password confirmation
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User account successfully deleted
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