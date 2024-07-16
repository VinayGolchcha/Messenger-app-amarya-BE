import mongoose from 'mongoose';
import {GroupModel} from './groupModel.js';
import { GroupMessageModel } from './groupMessagesModel.js';

export const createGroupQuery = async (data) => {
    return await GroupModel.create(data);
}

export const updateGroupQuery = async (id, data) => {
    try {
        return await GroupModel.findByIdAndUpdate(id, {$set: data}, { safe: true, upsert: false, new: true });
    } catch (error) {
        console.error('Error finding checkGroupNameExistsQuery details:', error);
        throw error;
    }
}

export const groupDetailQuery = async (user_id) => {
    return await GroupModel.findOne({ 'members': user_id })
    .lean();
}

export const checkGroupNameExistsQuery = async(group_name) => {
    try {
        return await GroupModel.find({group_name: group_name}).select('group_name created_by members');
    } catch (error) {
        console.error('Error finding checkGroupNameExistsQuery details:', error);
        throw error;
    }
}

export const addGroupMessageQuery = async(message_data) => {
    try {
        return await GroupMessageModel.create(message_data);
    } catch (error) {
        console.error('Error finding addGroupMessageQuery details:', error);
        throw error;
    }
}

export const getGroupDataQuery = async(group_name) => {
    try {
        return await GroupModel.findOne({'group_name': group_name});
    } catch (error) {
        console.error('Error finding getGroupDataQuery details:', error);
        throw error;
    }
}

export const fetchGroupChatHistoryQuery = async (group_id, date, sender_id) => {
    try {
        let given_date = new Date(date);
        const max_look_back_days = 30; // Maximum look-back days to avoid infinite loops
        let result = [];
        let required_days = 5;

        while (required_days <= max_look_back_days) {
            let currentStartDate = new Date(given_date);
            currentStartDate.setDate(given_date.getDate() - required_days + 1);

            const pipeline = [
                {
                    $match: {
                        group_id: group_id,
                        sent_at: {
                            $gte: currentStartDate,
                            $lt: new Date(given_date.setDate(given_date.getDate() + 1))
                        },
                        $or: [
                            { sender_deleted: { $ne: true } },
                            { $and: [
                                { senders_id: sender_id },
                                { sender_deleted: false }
                            ]}
                        ]
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
                        _id: 1,
                        group_id: 1,
                        senders_id: 1,
                        'sender.username': 1,
                        content: 1,
                        message_type: 1,
                        media_id: 1,
                        'media.file_type': 1,
                        'media.file_name': 1,
                        'media.file_data': 1,
                        sent_at: {
                            $dateToString: {
                                format: "%H:%M",
                                date: { $add: ["$sent_at", 19800000] } // IST offset in milliseconds
                            }
                        },
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$sent_at" } },
                        is_sent_by_sender: { $eq: ['$senders_id', sender_id] }
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
                                _id: "$_id",
                                group_id: "$group_id",
                                senders_id: "$senders_id",
                                sender_name: "$sender.username",
                                content: "$content",
                                message_type: "$message_type",
                                media_id: "$media_id",
                                media_details: {
                                    file_type: "$media.file_type",
                                    file_name: "$media.file_name",
                                    file_buffer: "$media.file_data"
                                },
                                sent_at: "$sent_at",
                                is_sent_by_sender: "$is_sent_by_sender"
                            }
                        }
                    }
                },
                {
                    $sort: { _id: -1 }
                }
            ];

            result = await GroupMessageModel.aggregate(pipeline);

            if (result.length > 0) {
                break; 
            }

            given_date.setDate(given_date.getDate() - required_days);
            required_days++;
           
            if (required_days > max_look_back_days) {
                console.log(`No data found for group ${group_id} within the last ${max_look_back_days} days.`);
            }
        }
        return result;
    } catch (error) {
        console.error('Error fetching group chat history:', error);
        throw error;
    }
};

export const fetchGroupsDataForUserQuery = async(user_id) => {
    try {
        const pipeline = [
            {
                $match: {
                    members: user_id
                }
            },
            {
                $project: {
                    _id: 1,
                    group_name: 1,
                    members: 1,
                    created_by: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ];

        const result = await GroupModel.aggregate(pipeline);
        return result;
    } catch (error) {
        console.error('Error finding fetchGroupsDataForUserQuery details:', error);
        throw error;
    }
}

export const checkUserAsAdminForGroupQuery = async(id, user_id) => {
    try {
        return await GroupModel.findOne({_id: id, created_by: user_id}).select('group_name created_by members');
    } catch (error) {
        console.error('Error finding checkUserAsAdminForGroupQuery details:', error);
        throw error;
    }
}

export const findGroupByNameQuery = async(search_text) => {
    try {
        return await GroupModel.find({ group_name: { $regex: search_text, $options: 'i' } }).select('_id group_name created_by');
    } catch (error) {
        console.error('Error finding findGroupByNameQuery details:', error);
        throw error;
    }
}

export const findMessageinGroupQuery = async(search_text, group_id) => {
    try {
        return await GroupMessageModel.find({ 
            content: { $regex: search_text, $options: 'i' }, 
            group_id: group_id 
          })
          .select('_id content message_type senders_id media_id')
          .populate('media_id', 'file_type file_name file_data');
    } catch (error) {
        console.error('Error finding findMessageinGroupQuery details:', error);
        throw error;
    }
}

export const fetchGroupConversationListQuery = async(user_id, limit_per_sender = 1) => {
    try {
        const pipeline = [
            {
                $lookup: {
                    from: 'groups',
                    localField: 'group_id',
                    foreignField: '_id',
                    as: 'group'
                }
            },
            {
                $unwind: '$group'
            },
            {
                $match: { 
                        'group.members': user_id
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
                $sort: { sent_at: -1 }
            },
            {
                $group: {
                    _id: "$senders_id",
                    sender_name: { $first: "$sender.username" },
                    group_id: { $first: "$group._id" },
                    group_name: { $first: "$group.group_name" },
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
                            sent_at: {
                                $dateToString: {
                                    format: "%H:%M",
                                    date: { $add: ["$sent_at", 19800000] }
                                }
                            }
                        }
                    },
                    new_messages_count: {
                        $sum: {
                            $cond: [{ $not: { $in: [user_id, "$read_by"] } }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    type: "group",
                    senders_id: "$_id",
                    sender_name: 1,
                    reciever_username: null, 
                    group_id: 1,
                    group_name: 1,
                    messages: { $slice: ["$messages", limit_per_sender] },
                    new_messages_count: 1,
                    _id: 0
                }
            }
        ];

        return await GroupMessageModel.aggregate(pipeline);
    } catch (error) {
        console.error('Error finding fetchGroupConversationListQuery details:', error);
        throw error;
    }
}

export const updateReadByStatusQuery = async(id, user_id) => {
    try {
        return await GroupMessageModel.updateOne({_id: id}, { $addToSet: { read_by: user_id } });
    } catch (error) {
        console.error('Error finding updateReadByStatusQuery details:', error);
        throw error;
    }
}