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
        return await MessageModel.find({senders_id: senders_id, recievers_id: recievers_id, content: { $regex: search_text, $options: 'i' }, sender_deleted: false}).select('senders_id recievers_id content message_type media_id sent_at');
    } catch (error) {
        console.error('Error finding findMessageQuery details:', error);
        throw error;
    }
}

export const fetchChatHistoryQuery = async (senders_id, recievers_id, date) => {
    try {
        let given_date = new Date(date);
        const max_look_back_days = 30; // Maximum look-back days to avoid infinite loops
        let data_found = false;
        let result = [];
        let required_days = 5;

        while (!data_found) {
            let currentStartDate = new Date(given_date);
            currentStartDate.setDate(given_date.getDate() - required_days + 1);

            const pipeline = [
                {
                    $match: {
                        $or: [
                            { senders_id: senders_id, recievers_id: recievers_id },
                            { senders_id: recievers_id, recievers_id: senders_id }
                        ],
                        sent_at: { $gte: currentStartDate, $lt: new Date(given_date.setDate(given_date.getDate() + 1)) },
                        sender_deleted: false
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

            result = await MessageModel.aggregate(pipeline);
            if (result.length > 0) {
                data_found = true;
            } else {
                // If not enough data, adjust the date range and reduce the required days
                given_date = new Date(given_date.setDate(given_date.getDate() - 1));
                required_days = Math.max(1, required_days - 1); // Ensure required_days doesn't go below 1

                // Calculate the total look-back period to avoid infinite loops
                const look_back_period = (new Date(date) - given_date) / (1000 * 60 * 60 * 24);
                if (look_back_period >= max_look_back_days) {
                    return result;
                }
            }
        }
        return result;
    } catch (error) {
        console.error('Error finding fetchChatHistoryQuery details:', error);
        throw error;
    }
}

export const fetchNewMessagesForUserQuery = async(user_id) => {
    try {
        return await MessageModel.find({ recievers_id: user_id, is_new: true, reciever_deleted: false }).select('senders_id recievers_id content message_type media_id sent_at');
    } catch (error) {
        console.error('Error finding fetchNewMessagesForUserQuery details:', error);
        throw error;
    }
}

export const checkUserForGivenMessageQuery = async(user_id, message_id) => {
    try {
        return await MessageModel.findOne({
            _id: message_id,
            $or: [
                { recievers_id: user_id },
                { senders_id: user_id }
            ]
        }).select('senders_id recievers_id content message_type media_id sent_at');
    } catch (error) {
        console.error('Error finding checkUserForGivenMessageQuery details:', error);
        throw error;
    }
}

export const updateDeleteStatusForUserQuery = async (is_user_sender, id) => {
    try {
        if(is_user_sender == true){
            return await MessageModel.findByIdAndUpdate(id, { sender_deleted: true }, { safe: true, upsert: true, new: false });
        }else{
            return await MessageModel.findByIdAndUpdate(id, { reciever_deleted: true }, { safe: true, upsert: true, new: false });
        }
    } catch (error) {
        console.error('Error finding updateDeleteStatusForUserQuery details:', error);
        throw error;
    }
}

export const deleteMessageByIdQuery = async(message_id) => {
    try {
        return await MessageModel.deleteOne({ _id: new mongoose.Types.ObjectId(message_id) });
    } catch (error) {
        console.error('Error finding deleteMessageByIdQuery details:', error);
        throw error;
    }
}

export const updateDeleteStatusForAllMessagesInChatQuery = async(user_id) => {
    try {
        return await MessageModel.updateMany({senders_id: user_id}, { sender_deleted: true }, { safe: true, upsert: true, new: false });
    } catch (error) {
        console.error('Error finding updateDeleteStatusForAllMessagesInChatQuery details:', error);
        throw error;
    }
}