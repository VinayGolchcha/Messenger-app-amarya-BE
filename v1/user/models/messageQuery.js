import mongoose from 'mongoose';
import {MessageModel} from './messageModel.js';

export const addMessageQuery = async (message_data) => {
    try{
        return await MessageModel.create(message_data);
    } catch (error) {
        console.error('Error finding addMessageQuery details:', error);
        throw error;
    }
}

export const markAsReadQuery = async (id) => {
    return await MessageModel.findByIdAndUpdate(id, { is_read: true, is_new: false });
}

export const findMessageQuery = async(senders_id, recievers_id, search_text) => {
    try {
        return await MessageModel.find({senders_id: senders_id, recievers_id: recievers_id, content: { $regex: search_text, $options: 'i' } }).select('senders_id recievers_id content message_type media_id sent_at');
    } catch (error) {
        console.error('Error finding findMessageQuery details:', error);
        throw error;
    }
}

export const fetchChatHistoryQuery = async(senders_id, recievers_id) => {
    try {
        const pipeline = [
            {
                $match: {
                    $or: [
                        { senders_id: senders_id, recievers_id: recievers_id },
                        { senders_id: recievers_id, recievers_id: senders_id }
                    ]
                }
            },
            {
                $project: {
                    senders_id: 1,
                    recievers_id: 1,
                    content: 1,
                    message_type: 1,
                    media_id: 1,
                    sent_at: 1,
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$sent_at" } }
                }
            },
            {
                $sort: { sent_at: -1 }
            },
            {
                $group: {
                    _id: "$date",
                    messages: {
                        $push: {
                            senders_id: "$senders_id",
                            recievers_id: "$recievers_id",
                            content: "$content",
                            message_type: "$message_type",
                            media_id: "$media_id",
                            sent_at: "$sent_at"
                        }
                    }
                }
            },
            {
                $sort: { _id: -1 }
            }
        ];

        return await MessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding fetchChatHistoryQuery details:', error);
        throw error;
    }
}

export const fetchNewMessagesForUserQuery = async(user_id) => {
    try {
        return await MessageModel.find({ recievers_id: user_id, is_new: true }).select('senders_id recievers_id content message_type media_id sent_at');
    } catch (error) {
        console.error('Error finding fetchNewMessagesForUserQuery details:', error);
        throw error;
    }
}