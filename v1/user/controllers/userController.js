import dotenv from "dotenv"
import {validationResult} from "express-validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';
import { successResponse, errorResponse, notFoundResponse, unAuthorizedResponse, internalServerErrorResponse } from "../../../utils/response.js"
import {create, userDetailQuery, insertTokenQuery, findAllUserDetailQuery, findUserByNameQuery, userDataQuery} from "../models/userQuery.js"
import { uploadMediaQuery } from "../models/mediaQuery.js";
import {fetchChatHistoryQuery, findMessageQuery, fetchNewMessagesForUserQuery} from "../models/messageQuery.js";

dotenv.config();

export const userInput = async (req, res) => {
    try {
        const userData = [{
            username: "Sanjana",
            email: "sanjana@yahoo.com",
            password: '$2b$12$Bb2hulXzeapnkrFNfDl5SOL7Xd0lAXo9SrolmQ5.KHtsIk1EKOiqS',
            is_registered: 1,
        }, {
            username: "Ashu",
            email: "ashu@yahoo.com",
            password: '$2b$12$Bb2hulXzeapnkrFNfDl5SOL7Xd0lAXo9SrolmQ5.KHtsIk1EKOiqS',
            is_registered: 1
        },
        {
            username: "Prabal",
            email: "prabal@yahoo.com",
            password: '$2b$12$Bb2hulXzeapnkrFNfDl5SOL7Xd0lAXo9SrolmQ5.KHtsIk1EKOiqS',
            is_registered: 1,
        }, {
            username: "Aditya",
            email: "aditya@yahoo.com",
            password: '$2b$12$Bb2hulXzeapnkrFNfDl5SOL7Xd0lAXo9SrolmQ5.KHtsIk1EKOiqS',
            is_registered: 1,
        }, {
            username: "Rashi",
            email: "rashi@yahoo.com",
            password: '$2b$12$Bb2hulXzeapnkrFNfDl5SOL7Xd0lAXo9SrolmQ5.KHtsIk1EKOiqS',
            is_registered: 1,
        }]
        for(let i = 0; i < userData.length; i++) {
            await create(userData[i])
        }
        return successResponse(res, '', `User In!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
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
        res.cookie('token', token, {
            httpOnly: true, // Cookie is accessible only through HTTP(S) protocol
            sameSite: 'None', // Allow cross-site usage
            secure: true // Ensures the cookie is only sent over HTTPS
          });
        return successResponse(res, { user_id: currentUser._id, user_name: currentUser.username + " " , email: email, is_email_verified: is_email_verified, token: token, socket_id: currentUser.socket_id }, message);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
};

export const userLogout = async (req, res) => {
    try {
        const user_id = req.params.id;
        console.log(req.decoded)
        await insertTokenQuery("", user_id);
        return successResponse(res, '', `You have successfully logged out!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const uploadFiles = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        const file = req.file;
        let file_type = req.body.file_type
        let user_id = req.body.user_id;

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
        console.error(error);
        return internalServerErrorResponse(res, error)
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
        console.error(error);
        return internalServerErrorResponse(res, error)
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
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const searchInMessages = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let {user_id, recievers_id, search_text} = req.body;
        user_id = new mongoose.Types.ObjectId(user_id)
        recievers_id = new mongoose.Types.ObjectId(recievers_id)
        search_text = search_text.toLowerCase();
        const data = await findMessageQuery(user_id, recievers_id, search_text);
        return successResponse(res, data, `Messages fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const fetchChatHistory = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let {user_id, recievers_id, date} = req.body;
        user_id = new mongoose.Types.ObjectId(user_id)
        recievers_id = new mongoose.Types.ObjectId(recievers_id)
        const data = await fetchChatHistoryQuery(user_id, recievers_id, date);
        return successResponse(res, data, `Messages fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const fetchNewMessages = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let user_id = req.params.user_id;
        user_id = new mongoose.Types.ObjectId(user_id)
        const data = await fetchNewMessagesForUserQuery(user_id);
        return successResponse(res, data, `Messages fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}