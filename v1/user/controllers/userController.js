import dotenv from "dotenv"
import {validationResult} from "express-validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';
import { sendMail } from "../../../config/nodemailer.js"
import { successResponse, errorResponse, notFoundResponse, unAuthorizedResponse } from "../../../utils/response.js"
import {create, userDetailQuery, insertTokenQuery, findAllUserDetailQuery, findUserByNameQuery} from "../models/userQuery.js"
import { uploadMediaQuery } from "../models/mediaQuery.js";
import {findMessageQuery} from "../models/messageQuery.js";

dotenv.config();

export const userInput = async (req, res) => {
    try {
        const userData = {
            username: "sanjanatest",
            email :'sanjanajain@amaryaconsutlancy.com',
            password: 'sdkjfnlgls',
            is_registered: 1,
        }
        await create(userData)
        return successResponse(res, '', `User In!`);
    } catch (error) {
        next(error);
    }
}

export const userLogin = async (req, res) => {
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
        return successResponse(res, { user_id: currentUser._id, user_name: currentUser.username + " " , email: email, is_email_verified: is_email_verified, token: token }, message);
    } catch (error) {
        next(error);
    }
};

export const userLogout = async (req, res) => {
    try {
        const user_id = req.params.id;
        await insertTokenQuery("", user_id);
        return successResponse(res, '', `You have successfully logged out!`);
    } catch (error) {
        next(error);
    }
}

export const uploadFiles = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        const file = req.file;
        let {file_type, user_id} = req.body;

        user_id = new mongoose.Types.ObjectId(user_id)
        const files_data = {
            file_type : file_type,
            file_name : file.originalname,
            file_data : file.buffer,
            uploaded_by: user_id
        }
        const data = await uploadMediaQuery(files_data)
        const response = {
            _id: data._id,
            file_type: data.file_type,
            file_name: data.file_name,
            uploaded_by:data.uploaded_by,
            uploaded_at:data.uploaded_at,
        }
        return successResponse(res, response, `File uploaded successfully!`);
    } catch (error) {
        next(error);
    }
}

export const fetchAllContacts = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }
        const data = await findAllUserDetailQuery();
        return successResponse(res, data, `All contacts fetched successfully!`);
    } catch (error) {
        next(error);
    }
}

export const searchInContacts = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let {search_text} = req.body;
        search_text = search_text.toLowerCase();
        const data = await findUserByNameQuery(search_text);
        return successResponse(res, data, `Contact fetched successfully!`);
    } catch (error) {
        next(error);
    }
}

export const searchInMessages = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let {senders_id, recievers_id, search_text} = req.body;
        senders_id = new mongoose.Types.ObjectId(senders_id)
        recievers_id = new mongoose.Types.ObjectId(recievers_id)
        search_text = search_text.toLowerCase();
        const data = await findMessageQuery(senders_id, recievers_id, search_text);
        return successResponse(res, data, `Messages fetched successfully!`);
    } catch (error) {
        next(error);
    }
}