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