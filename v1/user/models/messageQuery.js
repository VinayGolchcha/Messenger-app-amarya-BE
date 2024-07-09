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
        const initial_date = new Date(given_date);

        while (!data_found) {
            let currentStartDate = new Date(given_date);
            currentStartDate.setDate(currentStartDate.getDate() - required_days + 1);

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
                    $lookup: {
                        from: 'media',
                        localField: 'media_id',
                        foreignField: '_id',
                        as: 'media'
                    }
                },
                {
                    $unwind: {
                        path: '$media',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        senders_id: 1,
                        recievers_id: 1,
                        content: 1,
                        message_type: 1,
                        media_id: 1,
                        'media.file_type': 1,
                        'media.file_name': 1,
                        'media.file_data': 1,
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
                                media_details: {
                                    file_type: "$media.file_type",
                                    file_name: "$media.file_name",
                                    file_buffer: "$media.file_data"
                                },
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
                given_date.setDate(given_date.getDate() - required_days);
                required_days = Math.max(1, required_days - 1); // Ensure required_days doesn't go below 1

                // Calculate the total look-back period to avoid infinite loops
                const look_back_period = (initial_date - given_date) / (1000 * 60 * 60 * 24);
                if (look_back_period >= max_look_back_days) {
                    return result;
                }
            }
        }
        return result;
    } catch (error) {
        console.error('Error fetching chat history:', error);
        throw error;
    }
}

export const fetchNewMessagesForUserQuery = async(user_id) => {
    try {
        return await MessageModel.find({ 
            recievers_id: user_id, 
            is_new: true, 
            // reciever_deleted: false 
        })
        .select('senders_id recievers_id content message_type media_id sent_at')
        .populate('media_id', 'file_type file_name file_data');
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
            return await MessageModel.findByIdAndUpdate(id, { sender_deleted: true }, { safe: true, upsert: true, new: true });
        }else{
            return await MessageModel.findByIdAndUpdate(id, { reciever_deleted: true }, { safe: true, upsert: true, new: true });
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
        return await MessageModel.updateMany({senders_id: user_id}, { sender_deleted: true }, { safe: true, upsert: true, new: true });
    } catch (error) {
        console.error('Error finding updateDeleteStatusForAllMessagesInChatQuery details:', error);
        throw error;
    }
}

export const fetchNewMessagesForNotificationQuery = async(user_id) => {
    try {
        const pipeline = [
            {
                $match: { 
                    recievers_id: user_id, 
                    is_new: true
                }
            },
            {
                $lookup: {
                    from: 'media',
                    localField: 'media_id',
                    foreignField: '_id',
                    as: 'media'
                }
            },
            {
                $unwind: {
                    path: '$media',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'senders_id',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $unwind: '$sender'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'recievers_id',
                    foreignField: '_id',
                    as: 'receiver'
                }
            },
            {
                $unwind: '$receiver'
            },
            {
                $group: {
                    _id: "$senders_id",
                    sender_name: { $first: "$sender.username" },
                    reciever_email: { $first: "$receiver.email" },
                    messages: {
                        $push: {
                            senders_id: "$senders_id",
                            recievers_id: "$recievers_id",
                            content: "$content",
                            message_type: "$message_type",
                            media_id: "$media_id",
                            media_details: {
                                file_type: "$media.file_type",
                                file_name: "$media.file_name",
                                file_data: "$media.file_data"
                            },
                            sent_at: "$sent_at"
                        }
                    }
                }
            },
            {
                $project: {
                    senders_id: "$_id",
                    sender_name: 1,
                    reciever_email: 1, 
                    messages: 1,
                    _id: 0
                }
            }
        ];

        return await MessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding fetchNewMessagesForUserQuery details:', error);
        throw error;
    }
}

export const fetchConversationListQuery = async(user_id, limit_per_sender = 1) => {
    try {
        const pipeline = [
            {
                $match: { 
                    $or: [
                        { recievers_id: user_id },
                        { 'group.members': user_id }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'media',
                    localField: 'media_id',
                    foreignField: '_id',
                    as: 'media'
                }
            },
            {
                $unwind: {
                    path: '$media',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'senders_id',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $unwind: '$sender'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'recievers_id',
                    foreignField: '_id',
                    as: 'receiver'
                }
            },
            {
                $unwind: '$receiver'
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'group_id',
                    foreignField: '_id',
                    as: 'group'
                }
            },
            {
                $unwind: {
                    path: '$group',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { sent_at: -1 }
            },
            {
                $group: {
                    _id: "$senders_id",
                    sender_name: { $first: "$sender.username" },
                    reciever_username: { $first: "$receiver.username" },
                    group_id: { $first: "$group._id" },
                    group_name: { $first: "$group.name" },
                    messages: {
                        $push: {
                            senders_id: "$senders_id",
                            content: "$content",
                            message_type: "$message_type",
                            media_id: "$media_id",
                            media_details: {
                                file_type: "$media.file_type",
                                file_name: "$media.file_name",
                                file_data: "$media.file_data"
                            },
                            sent_at: "$sent_at"
                        }
                    }
                }
            },
            {
                $project: {
                    senders_id: "$_id",
                    sender_name: 1,
                    reciever_username: 1, 
                    group_id: 1,
                    group_name: 1,
                    messages: { $slice: ["$messages", limit_per_sender] },
                    _id: 0
                }
            }
        ];

        return await MessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding fetchConversationListQuery details:', error);
        throw error;
    }
}
