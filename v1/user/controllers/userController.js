import dotenv from "dotenv"
import {validationResult} from "express-validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { sendMail } from "../../../config/nodemailer.js"
import { successResponse, errorResponse, notFoundResponse, unAuthorizedResponse } from "../../../utils/response.js"
import {create, userDetailQuery, insertTokenQuery, insertOtpQuery, getOtpQuery, updateUserPasswordQuery} from "../models/userQuery.js"

dotenv.config();

export const userInput = async (req, res, next) => {
    try {
        const userData = {
            username: "Sanjana",
            email :'sanjana@gmail.com',
            password: 'sdkjfnlgls',
            is_registered: 1,
            system_number: "jksdkljopgjjsdpow423235"
        }
        await create(userData)
        return successResponse(res, '', `User In!`);
    } catch (error) {
        next(error);
    }
}

export const userLogin = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }
        let is_email_verified = true;
        const { email, password } = req.body;
        const user = await userDetailQuery(email);
        if (!user) {
            return errorResponse(res, '', 'User not found');
        }
        const currentUser = user;
        if (currentUser.is_email_verified===false) {
            is_email_verified = false;
            return errorResponse(res, {is_email_verified:is_email_verified}, 'Please verify your email first before proceeding.');
        }
        let message = '';
        let token = '';
        if (email && password) {
            const isPasswordValid = await bcrypt.compare(password, currentUser.password);
            if (isPasswordValid) {
                message = 'You are successfully logged in';
            } else {
                return unAuthorizedResponse(res, '', 'Password is not correct. Please try again.');
            }
        } else {
            return errorResponse(res, '', 'Input fields are incorrect!');
        }
        token = jwt.sign({ id: currentUser._id, name: currentUser.user_name }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION_TIME,
        });
        await insertTokenQuery(token, currentUser._id);
        return successResponse(res, { user_id: currentUser._id, user_name: currentUser.username + " " , is_email_verified: is_email_verified, token: token }, message);
    } catch (error) {
        next(error);
    }
};

export const userLogout = async (req, res, next) => {
    try {
        const user_id = req.params.id;
        await insertTokenQuery("", user_id);
        return successResponse(res, '', `You have successfully logged out!`);
    } catch (error) {
        next(error);
    }
}

export const sendOtpApi = async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }
        const { email } = req.body;
        const otp = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit OTP
        const otpdata = await insertOtpQuery(email, otp)
        if (!otpdata) {
            return errorResponse(res, '', 'Sorry, User not found.');
        } else {
            await sendMail(email, `Given below is the otp to verify,\n${otp} \n\n\n\nRegards,\nMessenger App Community`, 'Password Change Verification');
            return successResponse(res, '', 'OTP for password update has been sent successfully.');
        }
    } catch (error) {
        next(error);
    }
}

export const verifyOtpApi= async (req, res, next)=> {
    try{
        let { otp, email } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }
        otp = parseInt(otp, 10);
        const user_otp = await getOtpQuery(email);
        if (otp === user_otp.otp) {
            return successResponse(res, { email: email}, 'OTP verified successfully.');
        } else {
            return errorResponse(res, '', 'Invalid OTP');
        }
    } catch (error) {
        next(error);
    }
}

export const updateUserPassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }
        const {email, password, confirm_password} = req.body;

        let user_data = await userDetailQuery(email);
        if (!user_data) {
            return errorResponse(res, '', 'User not found');
        }
        if (password === confirm_password) {
            const password_hash = await bcrypt.hash(password.toString(), 12);
            await updateUserPasswordQuery(email, password_hash);
            return successResponse(res,"", 'User password updated successfully');
        } else {
            return errorResponse(res, '', 'Password and confirm password must be same, please try again.');
        }
    } catch (error) {
        next(error);
    }
}

export const checkEmailVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }
        let user_data = await userDetailQuery(email);
        if (!user_data) {
            return errorResponse(res, '', 'User not found');
        }
        return successResponse(res, { is_email_verified: user_data.is_email_verified }, 'Email verification status.');
    } catch (error) {
        next(error);
    }
}