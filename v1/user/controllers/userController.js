import dotenv from "dotenv";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';
import { sendMail } from "../../../config/nodemailer.js";
import { successResponse, errorResponse, notFoundResponse, unAuthorizedResponse } from "../../../utils/response.js";
import { create, userDetailQuery, insertTokenQuery, findAllUserDetailQuery, findUserByNameQuery, findMessageQuery, findGroupByName, findGroupById, deleteMessageById, updateMessageAsDeleted, createNotificationQuery, getNotificationsQuery, muteNotificationsQuery, unmuteNotificationsQuery, isMutedQuery } from "../models/userQuery.js";
import { uploadMediaQuery } from "../models/mediaQuery.js";
import { MessageModel } from "../models/messageModel.js";
import { GroupModel } from "../models/groupModel.js";
import { NotificationModel } from "../models/notificationModel.js";
import { MuteModel } from '../models/muteModel.js';
dotenv.config();

export const userInput = async (req, res) => {
    try {
        const userData1 = {
            username: "sanjanatest",
            email: 'sanjanajain@amaryaconsutlancy.com',
            password: 'sdkjfnlgls',
            is_registered: 1,
        };

        const userData2 = {
            username: "RaashiAggarwal",
            email: 'raashiaggarwal@gmail.com',
            password: 'n123456',
            is_registered: 1,
        };

        await create(userData1);
        await create(userData2);

        return successResponse(res, '', 'Users In!');
    } catch (error) {
        console.error(error);
    }
};

export const userLogin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "");
        }
        let is_email_verified = true;
        const { email, password } = req.body;
        const user = await userDetailQuery(email);
        if (!user) {
            return errorResponse(res, '', 'User not found');
        }
        const currentUser = user;
        if (currentUser.is_email_verified === false) {
            is_email_verified = false;
            return errorResponse(res, { is_email_verified: is_email_verified }, 'Please verify your email first before proceeding.');
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
        return successResponse(res, { user_id: currentUser._id, user_name: currentUser.username + " ", email: email, is_email_verified: is_email_verified, token: token }, message);
    } catch (error) {
        console.error(error);
    }
};

export const userLogout = async (req, res) => {
    try {
        const user_id = req.params.id;
        await insertTokenQuery("", user_id);
        return successResponse(res, '', 'You have successfully logged out!');
    } catch (error) {
        console.error(error);
    }
};

export const uploadFiles = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "");
        }

        const file = req.file;
        let { file_type, user_id } = req.body;

        user_id = new mongoose.Types.ObjectId(user_id);
        const files_data = {
            file_type: file_type,
            file_name: file.originalname,
            file_data: file.buffer,
            uploaded_by: user_id
        };
        const data = await uploadMediaQuery(files_data);
        const response = {
            _id: data._id,
            file_type: data.file_type,
            file_name: data.file_name,
            uploaded_by: data.uploaded_by,
            uploaded_at: data.uploaded_at,
        };
        return successResponse(res, response, 'File uploaded successfully!');
    } catch (error) {
        console.error(error);
    }
};

export const fetchAllContacts = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "");
        }
        const data = await findAllUserDetailQuery();
        return successResponse(res, data, 'All contacts fetched successfully!');
    } catch (error) {
        console.error(error);
    }
};

export const searchInContacts = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "");
        }

        let { search_text } = req.body;
        search_text = search_text.toLowerCase();
        const data = await findUserByNameQuery(search_text);
        return successResponse(res, data, 'Contact fetched successfully!');
    } catch (error) {
        console.error(error);
    }
};

export const searchInMessages = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "");
        }

        let { senders_id, receivers_id, search_text } = req.body;
        senders_id = new mongoose.Types.ObjectId(senders_id);
        receivers_id = new mongoose.Types.ObjectId(receivers_id);
        search_text = search_text.toLowerCase();
        const data = await findMessageQuery(senders_id, receivers_id, search_text);
        return successResponse(res, data, 'Messages fetched successfully!');
    } catch (error) {
        console.error(error);
    }
};

export const deleteChats = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "Error in validation");
        }

        const { messageId } = req.body;
        const userId = req.user.id;

        // Find the message
        const message = await MessageModel.findById(messageId);

        if (!message) {
            return notFoundResponse(res, null, "Message not found");
        }

        // Check if the user is either the sender or the receiver
        if (message.senders_id.toString() !== userId && message.receivers_id.toString() !== userId) {
            return unAuthorizedResponse(res, null, "You are not authorized");
        }

        // Mark the message as deleted for the sender or receiver
        await updateMessageAsDeleted(messageId, userId);

        // Check if both sender and receiver have deleted the message, then remove it
        if (message.senders_deleted && message.receivers_deleted) {
            await deleteMessageById(messageId);
        }

        return successResponse(res, null, "Message deleted successfully");
    } catch (error) {
        next(error);
    }
};

export const deleteRoom = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array(), "Error in validation");
        }

        const { messageId } = req.body;
        const userId = req.user.id;

        // Find the message
        const message = await MessageModel.findById(messageId);

        if (!message) {
            return notFoundResponse(res, null, "Message not found");
        }

        // Determine if the logged-in user is the sender or receiver
        if (message.senders_id.toString() !== userId && message.receivers_id.toString() !== userId) {
            return unAuthorizedResponse(res, null, "You are not authorized to delete this message");
        }

        // Delete logic based on sender or receiver
        await updateMessageAsDeleted(messageId, userId);

        // Check if both sender and receiver have deleted the message, then remove it
        if (message.senders_deleted && message.receivers_deleted) {
            await deleteMessageById(messageId);
        }

        return successResponse(res, null, "Room deleted successfully");
    } catch (error) {
        next(error);
    }
};

export const fetchGroupData = async (req, res, next) => {
    const { group_name } = req.body;

    try {
        let data;
        if (group_name) {
            const regex = new RegExp(group_name, 'i'); // 'i' for case-insensitive
            data = await findGroupByName(regex);
        } else {
            data = await GroupModel.find();
        }

        if (!data || data.length === 0) {
            return notFoundResponse(res, null, "No groups found.");
        }

        return successResponse(res, data, "Groups fetched successfully.");
    } catch (error) {
        console.error("Error fetching group data:", error);
        return errorResponse(res, null, "Server error.");
    }
};

export const fetchSelectedGroupData = async (req, res, next) => {
    const { group_name, group_id } = req.body;

    if (!group_name && !group_id) {
        return errorResponse(res, null, "Group name or Group ID must be provided.");
    }

    try {
        let data;
        if (group_id) {
            data = await findGroupById(group_id);
        } else if (group_name) {
            data = await findGroupByName(group_name);
        }

        if (!data) {
            return notFoundResponse(res, null, "Group not found.");
        }

        return successResponse(res, data, "Group fetched successfully.");
    } catch (error) {
        console.error("Error fetching group data:", error);
        return errorResponse(res, null, "Server error.");
    }
};

export const createNotification = async (req, res) => {
    const { user_id, message } = req.body;

    if (!user_id || !message) {
        return errorResponse(res, null, "User ID and message must be provided.");
    }

    try {
        const notification = await createNotificationQuery(user_id, message);

        // Emit the notification to the user via Socket.IO
        req.io.to(user_id.toString()).emit('new_notification', notification);

        return successResponse(res, notification, "Notification created successfully.");
    } catch (error) {
        console.error("Error creating notification:", error);
        return errorResponse(res, null, "Server error.");
    }
};

// Get notifications for a user
export const getNotifications = async (req, res) => {
    const { user_id } = req.params;

    if (!user_id) {
        return errorResponse(res, null, "User ID must be provided.");
    }

    try {
        const notifications = await getNotificationsQuery(user_id);

        return successResponse(res, notifications, "Notifications fetched successfully.");
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return errorResponse(res, null, "Server error.");
    }
};

// Mute notifications for a chat
export const muteNotifications = async (req, res) => {
    const { user_id, chat_id, mute_until } = req.body;

    if (!user_id || !chat_id) {
        return errorResponse(res, null, "User ID and chat ID must be provided.");
    }

    try {
        await muteNotificationsQuery(user_id, chat_id, mute_until);

        return successResponse(res, null, "Notifications muted successfully.");
    } catch (error) {
        console.error("Error muting notifications:", error);
        return errorResponse(res, null, "Server error.");
    }
};

// Unmute notifications for a chat
export const unmuteNotifications = async (req, res) => {
    const { user_id, chat_id } = req.body;

    if (!user_id || !chat_id) {
        return errorResponse(res, null, "User ID and chat ID must be provided.");
    }

    try {
        await unmuteNotificationsQuery(user_id, chat_id);

        return successResponse(res, null, "Notifications unmuted successfully.");
    } catch (error) {
        console.error("Error unmuting notifications:", error);
        return errorResponse(res, null, "Server error.");
    }
};

// Check if notifications are muted for a chat
export const isMuted = async (user_id, chat_id) => {
    try {
        return await isMutedQuery(user_id, chat_id);
    } catch (error) {
        console.error("Error checking mute status:", error);
        return false;
    }
};
