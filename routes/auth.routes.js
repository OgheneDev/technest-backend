
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
 *     summary: Register a new user account
 *     description: Create a new user with email and password. Optionally provide an adminCode to create an admin account.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               adminCode:
 *                 type: string
 *             example:
 *               email: "user@example.com"
 *               password: "strongPassword123"
 *     responses:
 *       201:
 *         description: User created and token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       400:
 *         description: Validation error or user already exists
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
 *     summary: Authenticate user and return a JWT token
 *     description: Verify the supplied credentials and return an authentication token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             example:
 *               email: "user@example.com"
 *               password: "strongPassword123"
 *     responses:
 *       200:
 *         description: Authenticated successfully; token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid credentials
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
 *     summary: Get profile of the currently authenticated user
 *     description: Returns the authenticated user's profile data. Requires Bearer JWT in Authorization header.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Unauthorized - missing or invalid token
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
 *     summary: Request a password reset email
 *     description: Generates a password reset token and sends a reset link to the user's email if the account exists.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             example:
 *               email: "user@example.com"
 *     responses:
 *       200:
 *         description: Email sent (if the user exists)
 *       404:
 *         description: No user found with that email
 */
router.post('/forgotpassword', forgotPassword);

/**
 * @openapi
 * /api/auth/resetpassword/{resettoken}:
 *   put:
 *     summary: Reset password using token
 *     description: Use the reset token sent via email to set a new password. Returns a new auth token on success.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: resettoken
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset token received via email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *             example:
 *               password: "newStrongPassword123"
 *     responses:
 *       200:
 *         description: Password reset successful; new token returned
 *       400:
 *         description: Invalid or expired token
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
 *     summary: Change the authenticated user's password
 *     description: Verify the current password and update to a new password. Returns a new JWT token on success.
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
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *             example:
 *               currentPassword: "oldPassword123"
 *               newPassword: "newStrongPassword123"
 *     responses:
 *       200:
 *         description: Password updated and new token returned
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Current password incorrect
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
 *     summary: Update authenticated user's profile fields and avatar image
 *     description: Update firstName, lastName, phoneNumber and/or upload a new avatar image. Avatar must be sent as multipart/form-data file under the "avatar" field.
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
 *             example:
 *               firstName: "John"
 *               lastName: "Doe"
 *     responses:
 *       200:
 *         description: Updated user object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     avatar:
 *                       type: string
 *       400:
 *         description: No fields provided or invalid file
 *       401:
 *         description: Unauthorized
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
 *     summary: Delete the authenticated user's account
 *     description: Permanently deletes the user's account after confirming the password.
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
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *             example:
 *               password: "currentPassword123"
 *     responses:
 *       200:
 *         description: Account successfully deleted
 *       400:
 *         description: Missing password
 *       401:
 *         description: Incorrect password or unauthorized
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
