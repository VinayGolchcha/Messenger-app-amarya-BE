import mongoose from 'mongoose';
import { UserModel } from './userModel.js';
import { MessageModel } from './messageModel.js';
import { GroupModel } from './groupModel.js';
import { NotificationModel } from './notificationModel.js';
import { MuteModel } from './muteModel.js';

export const create = async (user_data) => {
    return await UserModel.create(user_data);
};

export const userDetailQuery = async (email) => {
    return await UserModel.findOne({ 'email': email, 'is_registered': true })
        .lean();
};

export const insertTokenQuery = async (token, id) => {
    return await UserModel.findOneAndUpdate({ _id: id, is_registered: true }, { $set: { "auth_token": token } }, { safe: true, upsert: false, new: false });
};

export const updateSocketId = async (email, socket_id) => {
    return await UserModel.findOneAndUpdate({ email: email }, { $set: { "socket_id": socket_id } }, { safe: true, upsert: true, new: true });
};

export const userGroupDetailQuery = async (socket_id, user_id, group_name) => {
    try {
        let object_id = new mongoose.Types.ObjectId(user_id);
        const pipeline = [
            {
                $match: {
                    socket_id: socket_id,
                    _id: object_id
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: '_id',
                    foreignField: 'members',
                    as: 'group_members'
                }
            },
            {
                $unwind: {
                    path: '$group_members',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    'group_members.group_name': group_name
                }
            },
            {
                $project: {
                    username: 1,
                    group_name: '$group_members.group_name'
                }
            }
        ];

        return await UserModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding userGroupDetailQuery details:', error);
        throw error;
    }
};

export const findUserDetailQuery = async (socket_id) => {
    return await UserModel.findOne({ socket_id: socket_id }).lean();
};

export const findAllUserDetailQuery = async () => {
    try {
        return await UserModel.find({ is_registered: true }).select('_id username email socket_id');
    } catch (error) {
        console.error('Error finding findAllUserDetailQuery details:', error);
        throw error;
    }
};

export const findUserByNameQuery = async (search_text) => {
    try {
        return await UserModel.find({ username: { $regex: search_text, $options: 'i' } }).select('_id username email socket_id');
    } catch (error) {
        console.error('Error finding findUserByNameQuery details:', error);
        throw error;
    }
};

export const findMessageQuery = async (senders_id, receivers_id, search_text) => {
    try {
        return await MessageModel.find({
            $or: [
                { senders_id: senders_id, receivers_id: receivers_id, message: { $regex: search_text, $options: 'i' } },
                { senders_id: receivers_id, receivers_id: senders_id, message: { $regex: search_text, $options: 'i' } }
            ]
        }).select('_id message senders_id receivers_id created_at');
    } catch (error) {
        console.error('Error finding findMessageQuery details:', error);
        throw error;
    }
};

export const findGroupByName = async (group_name) => {
    try {
        return await GroupModel.find({ group_name: { $regex: group_name } });
    } catch (error) {
        console.error('Error finding findGroupByName details:', error);
        throw error;
    }
};

export const findGroupById = async (group_id) => {
    try {
        return await GroupModel.findById(group_id);
    } catch (error) {
        console.error('Error finding findGroupById details:', error);
        throw error;
    }
};

export const deleteMessageById = async (messageId) => {
    try {
        return await MessageModel.findByIdAndDelete(messageId);
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
};

export const updateMessageAsDeleted = async (messageId, userId) => {
    try {
        const message = await MessageModel.findById(messageId);
        if (message.senders_id.toString() === userId) {
            await MessageModel.findByIdAndUpdate(messageId, { $set: { senders_deleted: true } });
        } else if (message.receivers_id.toString() === userId) {
            await MessageModel.findByIdAndUpdate(messageId, { $set: { receivers_deleted: true } });
        }
    } catch (error) {
        console.error('Error updating message as deleted:', error);
        throw error;
    }
};

export const createNotificationQuery = async (user_id, message) => {
    try {
        const notification = new NotificationModel({
            user_id,
            message
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export const getNotificationsQuery = async (user_id) => {
    try {
        return await NotificationModel.find({ user_id }).sort({ created_at: -1 });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

export const muteNotificationsQuery = async (user_id, chat_id, mute_until) => {
    try {
        const muteData = {
            user_id,
            chat_id,
            muted: true,
            muted_until: mute_until
        };

        const existingMute = await MuteModel.findOne({ user_id, chat_id });
        if (existingMute) {
            await MuteModel.updateOne({ user_id, chat_id }, muteData);
        } else {
            const mute = new MuteModel(muteData);
            await mute.save();
        }
    } catch (error) {
        console.error('Error muting notifications:', error);
        throw error;
    }
};

export const unmuteNotificationsQuery = async (user_id, chat_id) => {
    try {
        await MuteModel.deleteOne({ user_id, chat_id });
    } catch (error) {
        console.error('Error unmuting notifications:', error);
        throw error;
    }
};

export const isMutedQuery = async (user_id, chat_id) => {
    try {
        const muteRecord = await MuteModel.findOne({ user_id, chat_id });
        if (muteRecord) {
            if (muteRecord.muted_until && new Date(muteRecord.muted_until) < new Date()) {
                // Mute period has expired, delete the record
                await MuteModel.deleteOne({ user_id, chat_id });
                return false;
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking mute status:', error);
        return false;
    }
};
