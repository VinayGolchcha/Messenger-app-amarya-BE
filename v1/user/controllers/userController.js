import dotenv from "dotenv"
import {validationResult} from "express-validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';
import { successResponse, errorResponse, notFoundResponse, unAuthorizedResponse, internalServerErrorResponse } from "../../../utils/response.js"
import {create, userDetailQuery, insertTokenQuery, findAllUserDetailQuery, findUserByNameQuery, userDataQuery} from "../models/userQuery.js"
import { uploadMediaQuery } from "../models/mediaQuery.js";
import {fetchChatHistoryQuery, findMessageQuery, fetchNewMessagesForUserQuery, checkUserForGivenMessageQuery, updateDeleteStatusForUserQuery, 
    deleteMessageByIdQuery, updateDeleteStatusForAllMessagesInChatQuery, fetchConversationListQuery} from "../models/messageQuery.js";
import { fetchGroupConversationListQuery, findGroupByNameQuery } from "../models/groupQuery.js";

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
            httpOnly: false, // Cookie is accessible only through HTTP(S) protocol
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
        const user_data = await findUserByNameQuery(search_text);
        const group_data = await findGroupByNameQuery(search_text);
        let data = {
            user_list : user_data,
            group_list : group_data
        }
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

export const deleteMessages = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let {action, message_id, user_id} = req.body
        let message;

        const deleteForMe = async () => {
            message_id = new mongoose.Types.ObjectId(message_id)
            user_id = new mongoose.Types.ObjectId(user_id)
            const is_user = await checkUserForGivenMessageQuery(user_id, message_id)

            if (is_user) {
                const is_user_sender = is_user.senders_id.toString() == user_id.toString() ? true: false;
                await updateDeleteStatusForUserQuery(is_user_sender, message_id)
                message = `Message deleted successfully`
                return message
            }
            message = `No message with that id found`
            return message
        }

        const deleteForEveryone = async () => {
            message_id = new mongoose.Types.ObjectId(message_id)
            const is_deleted = await deleteMessageByIdQuery(message_id)

            if (is_deleted) {
                message = `Message deleted successfully`
                return message
            }
            message = `No message with that id found`
            return message
        }

        const deleteChat = async () => {
            user_id = new mongoose.Types.ObjectId(user_id)
            const is_deleted = await updateDeleteStatusForAllMessagesInChatQuery(user_id)

            if (is_deleted.modifiedCount > 0) {
                message = `Message deleted successfully`
                return message
            }
            message = `No messages found`
            return message
        }

        switch(action){
            case 'deleteForMe': 
                await deleteForMe()
                break;
            case 'deleteForEveryone': 
                await deleteForEveryone()
                break;
            case 'deleteChat': 
                await deleteChat();
                break;
        }

        return successResponse(res, '', message);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}

export const fetchConversationsList = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "")
        }

        let user_id = req.params.user_id;
        user_id = new mongoose.Types.ObjectId(user_id)
        const [private_data, group_data] = await Promise.all([
            fetchConversationListQuery(user_id),
            fetchGroupConversationListQuery(user_id)
        ]);
        const combined_messages = [...private_data, ...group_data];
        return successResponse(res, combined_messages, `Data fetched successfully!`);
    } catch (error) {
        console.error(error);
        return internalServerErrorResponse(res, error)
    }
}