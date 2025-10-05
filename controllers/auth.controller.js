import User from "../models/user.js";
import { validationResult } from "express-validator";
import { sendTokenResponse } from "../utils/authUtils.js";
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';
import path from "path";
import fs from 'fs';
import { uploadBuffer } from "../utils/cloudinary.js";

// @desc   Register User
// @route  /api/auth/register
// @access Public

export const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
           return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, adminCode } = req.body;
        
        // Check if user already exists
        let user = await User.findOne({email});
        if (user) {
            return res.status(400).json({
             success: false,
             error: 'User already exists'
            }); 
        }
        
        // Determine role - user is default if adminCode is empty/undefined
        const role = adminCode ? 
            (adminCode === process.env.ADMIN_CODE ? 'admin' : 'user') : 
            'user'; 
        
        // Create a User
        user = await User.create({
            email,
            password,
            role
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        next(error);
    }
}

// @desc User login
// @route /api/auth/login
// @access Public

export const login = async (req, res, next) => {
    try {
        // Debug: log headers and body as early as possible
        console.log('Login request content-type:', req.headers['content-type']);
        console.log('Login request body:', req.body);
        const errors = validationResult(req);
    if (!errors.isEmpty()) {
       return res .status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    //Check for user
    const user = await User.findOne({email}).select('+password');
    if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    } 

    sendTokenResponse(user, 200, res);
    } catch (error) { 
        next(error);
    }
}

// @desc Get Me
// @route /api/auth/me
// @access private

export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        // If avatar exists and is a local path, ensure file exists.
        // If it's a remote URL (Cloudinary), leave it as-is.
        if (user && user.avatar) {
            const isRemote = /^https?:\/\//i.test(user.avatar);
            if (!isRemote) {
                const avatarPath = path.join(process.cwd(), 'Uploads', 'avatars', path.basename(user.avatar));
                if (!fs.existsSync(avatarPath)) {
                    user.avatar = null; // local file missing
                } else {
                    // if you want to return a public route for local files, uncomment:
                    // user.avatar = `/uploads/avatars/${path.basename(user.avatar)}`;
                }
            }
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('GetMe error:', error.message, error.stack);
        next(error);
    }
};

// @desc   Forgot password
// @route  POST /api/auth/forgotpassword
// @access Public
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an email address'
            });
        }

        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'There is no user with that email'
            });
        }

        // 2. Generate reset token using method from User model
        const resetToken = user.getResetPasswordToken();
        // Save the hashed token to database without validation
        await user.save({ validateBeforeSave: false });

        // 3. Create reset URL for frontend
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // 4. Send email with reset link
        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request',
                html: `
                    <h1>You requested a password reset</h1>
                    <p>Please click on the following link to reset your password:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                    <p>This link will expire in 10 minutes</p>
                    <p>If you didn't request this, please ignore this email</p>
                `
            });

            // 5. Send success response
            res.status(200).json({
                success: true,
                message: 'Email sent'
            });
        } catch (err) {
            // 6. If email fails, clear reset token fields
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                error: 'Email could not be sent'
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc   Reset password
// @route  PUT /api/auth/resetpassword/:resettoken
// @access Public
export const resetPassword = async (req, res, next) => {
    try {
        // 1. Hash the token from URL parameter
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        // 2. Find user with matching token that hasn't expired
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() } // Check if token hasn't expired
        });

        // 3. If no valid user found, return error
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid token'
            });
        }

        // 4. Set new password (will be hashed by pre-save middleware)
        user.password = req.body.password;
        
        // 5. Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        // 6. Save user with new password
        await user.save();

        // 7. Send new JWT token for automatic login
        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc   Update password
// @route  PUT /api/auth/updatepassword
// @access Private
export const updatePassword = async (req, res, next) => {
    try {
        // 1. Get user from database with password field
        const user = await User.findById(req.user.id).select('+password');

        // 2. Check current password
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Please provide current and new password'
            });
        }

        // Verify current password is correct
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // 3. Update password
        user.password = newPassword;
        await user.save();

        // 4. Send new token response
        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc   Update user details
// @route  PUT /api/auth/updatedetails
// @access Private
export const updateDetails = async (req, res, next) => {
    try {
        if (req.fileValidationError) {
            return res.status(400).json({
                success: false,
                error: req.fileValidationError.message
            });
        }

        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        console.log('Request body:', req.body, 'File:', req.file);

        const fieldsToUpdate = {};
        if (req.body.firstName) fieldsToUpdate.firstName = req.body.firstName;
        if (req.body.lastName) fieldsToUpdate.lastName = req.body.lastName;
        if (req.body.phoneNumber) fieldsToUpdate.phoneNumber = req.body.phoneNumber;

        if (req.file) {
            // Upload buffer to Cloudinary into "technest/avatars"
            const result = await uploadBuffer(req.file.buffer, { folder: 'technest/avatars' });
            fieldsToUpdate.avatar = result.secure_url;
            console.log('Avatar uploaded to Cloudinary:', result.secure_url);
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide at least one field to update'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            fieldsToUpdate,
            {
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Update details error:', error);
        next(error);
    }
};

// @desc   Delete user account
// @route  DELETE /api/auth/deleteaccount
// @access Private
export const deleteAccount = async (req, res, next) => {
    try {
        // 1. Verify the user's password before deletion
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide your password to confirm deletion'
            });
        }

        // 2. Get user with password field
        const user = await User.findById(req.user.id).select('+password');
        
        // 3. Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Password is incorrect'
            });
        }

        // 4. Delete the user
        await User.findByIdAndDelete(req.user.id);

        // 5. Send response
        res.status(200).json({
            success: true,
            message: 'User account successfully deleted'
        });
    } catch (error) {
        next(error);
    }
};
